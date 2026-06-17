<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MikrotikServer;
use App\Models\Client;
use App\Models\OLTUser;
use App\Services\MikrotikService;
use Illuminate\Http\Request;

class MikrotikController extends Controller
{
    private function getMk($server): MikrotikService
    {
        return new MikrotikService(
            $server->ip_address,
            $server->username,
            $server->password,
            $server->port
        );
    }

    public function index()
    {
        return response()->json(MikrotikServer::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'ip_address' => 'required',
            'port' => 'required|integer',
            'username' => 'required',
            'password' => 'required',
        ]);

        $server = MikrotikServer::create($request->all());
        $mk = $this->getMk($server);
        $connected = $mk->testConnection();
        $server->update(['is_connected' => $connected]);

        return response()->json([
            'message' => $connected ? 'Connected!' : 'Added but not connected',
            'server' => $server,
            'connected' => $connected
        ], 201);
    }

    public function destroy($id)
    {
        MikrotikServer::findOrFail($id)->delete();
        return response()->json(['message' => 'Server deleted!']);
    }

    public function sync($id)
    {
        $server = MikrotikServer::findOrFail($id);
        $mk = $this->getMk($server);

        // PPPoE active users
        $pppoeOnline = $mk->syncOnlineStatus();

        // ARP table — IP + MAC
        $arpUsers = $mk->request('/ip/arp');
        $arpOnlineIPs = array_column($arpUsers, 'address');

        // Update MAC address + OLT match via ARP
        foreach ($arpUsers as $arp) {
            if (!empty($arp['address']) && !empty($arp['mac-address'])) {
                $mac = strtoupper($arp['mac-address']);

                Client::where('mikrotik_server_id', $id)
                    ->where('ip_address', $arp['address'])
                    ->update(['mac_address' => $mac]);

                // Match OLT ONU by MAC
                $oltUser = OLTUser::where('mac_address', $mac)->first();
                if ($oltUser) {
                    Client::where('mikrotik_server_id', $id)
                        ->where('ip_address', $arp['address'])
                        ->update(['olt_user_id' => $oltUser->id]);
                }
            }
        }

        // Mark PPPoE online
        Client::where('mikrotik_server_id', $id)
            ->whereIn('username', $pppoeOnline)
            ->update(['is_online' => true, 'last_online_at' => now()]);

        // Mark Static IP online
        Client::where('mikrotik_server_id', $id)
            ->whereIn('ip_address', $arpOnlineIPs)
            ->update(['is_online' => true, 'last_online_at' => now()]);

        // Mark rest offline
        Client::where('mikrotik_server_id', $id)
            ->whereNotIn('username', $pppoeOnline)
            ->whereNotIn('ip_address', $arpOnlineIPs)
            ->update(['is_online' => false, 'last_offline_at' => now()]);

        $server->update(['is_connected' => true, 'last_synced_at' => now()]);

        $totalOnline = Client::where('mikrotik_server_id', $id)
            ->where('is_online', true)->count();

        $oltMatched = Client::where('mikrotik_server_id', $id)
            ->whereNotNull('olt_user_id')->count();

        return response()->json([
            'message'      => 'Synced!',
            'online_count' => $totalOnline,
            'pppoe_online' => count($pppoeOnline),
            'static_online'=> count($arpOnlineIPs),
            'olt_matched'  => $oltMatched,
        ]);
    }

    public function import($id)
    {
        $server = MikrotikServer::findOrFail($id);
        $mk = $this->getMk($server);
        $users = $mk->getAllUsers();
        $imported = 0;

        foreach ($users as $u) {
            Client::updateOrCreate(
                ['username' => $u['name']],
                [
                    'mikrotik_server_id' => $id,
                    'profile' => $u['profile'] ?? null,
                    'ip_address' => $u['remote-address'] ?? null,
                    'status' => ($u['disabled'] ?? 'false') === 'true' ? 'blocked' : 'active',
                ]
            );
            $imported++;
        }

        return response()->json([
            'message' => "Imported {$imported} clients!",
            'count' => $imported
        ]);
    }

    public function importQueue($id)
    {
        $server = MikrotikServer::findOrFail($id);
        $mk = $this->getMk($server);
        $queues = $mk->getQueueClients();
        $imported = 0;
        $skipped = 0;

        $skipNames = ['K_BLOCK','L_BLOCK','KARNAFULY','ANANDIPUR',
                      'SONALI','G_BLOCK','CITADEL','NETFLIX_MANGLE',
                      'Test','Test_IP'];

        foreach ($queues as $q) {
            $name = $q['name'] ?? '';
            if (empty($name)) { $skipped++; continue; }
            if (in_array($name, $skipNames)) { $skipped++; continue; }
            if (str_starts_with($name, 'queue')) { $skipped++; continue; }
            if (!str_contains($q['target'] ?? '', '/32')) { $skipped++; continue; }

            $ip = str_replace('/32', '', $q['target'] ?? '');
            $maxLimit = $q['max-limit'] ?? '1/1';
            $isBlocked = in_array($maxLimit, ['1/1', '1000/1000'])
                         || str_starts_with($name, 'B_');

            Client::updateOrCreate(
                ['username' => $name],
                [
                    'mikrotik_server_id' => $id,
                    'ip_address' => $ip,
                    'profile' => $maxLimit,
                    'status' => $isBlocked ? 'blocked' : 'active',
                    'is_online' => false,
                ]
            );
            $imported++;
        }

        return response()->json([
            'message' => "Queue imported: {$imported} clients! Skipped: {$skipped}",
            'imported' => $imported,
            'skipped' => $skipped,
        ]);
    }

    public function block(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $mk = $this->getMk($client->server);
        $mk->blockQueueUser($client->username);
        $client->update([
            'status' => 'blocked',
            'is_online' => false,
            'blocked_at' => now(),
            'blocked_by' => 'Admin',
        ]);
        return response()->json(['message' => 'Client blocked on Mikrotik!']);
    }

    public function unblock(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $mk = $this->getMk($client->server);
        $mk->unblockQueueUser($client->username, $client->profile ?? '10000000/10000000');
        $client->update([
            'status' => 'active',
            'blocked_at' => null,
            'blocked_by' => null,
        ]);
        return response()->json(['message' => 'Client unblocked on Mikrotik!']);
    }
}
