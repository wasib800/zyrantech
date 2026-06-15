<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MikrotikServer;
use App\Models\Client;
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

    // Server list
    public function index()
    {
        return response()->json(MikrotikServer::all());
    }

    // Add server
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

    // Sync online clients
    public function sync($id)
{
    $server = MikrotikServer::findOrFail($id);
    $mk = $this->getMk($server);

    // PPPoE active users
    $pppoeOnline = $mk->syncOnlineStatus();

    // Static IP online (ARP table)
    $arpUsers = $mk->request('/ip/arp');
    $arpOnlineIPs = array_column($arpUsers, 'address');

    // Mark PPPoE online
    Client::where('mikrotik_server_id', $id)
        ->whereIn('username', $pppoeOnline)
        ->update(['is_online' => true, 'last_online_at' => now()]);

    // Mark Static IP online by IP
    Client::where('mikrotik_server_id', $id)
        ->whereIn('ip_address', $arpOnlineIPs)
        ->update(['is_online' => true, 'last_online_at' => now()]);

    // Mark rest offline
    $allOnlineIPs = $arpOnlineIPs;
    Client::where('mikrotik_server_id', $id)
        ->whereNotIn('username', $pppoeOnline)
        ->whereNotIn('ip_address', $allOnlineIPs)
        ->update(['is_online' => false]);

    $server->update(['is_connected' => true, 'last_synced_at' => now()]);

    $totalOnline = Client::where('mikrotik_server_id', $id)
        ->where('is_online', true)->count();

    return response()->json([
        'message' => 'Synced!',
        'online_count' => $totalOnline,
        'pppoe_online' => count($pppoeOnline),
        'static_online' => count($arpOnlineIPs),
    ]);
}
    // Import PPPoE clients
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

    // Import Static IP (Queue) clients
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

    // Block client
    public function block(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $mk = $this->getMk($client->server);
        $mk->blockQueueUser($client->username);
        $client->update(['status' => 'blocked', 'is_online' => false]);
        return response()->json(['message' => 'Client blocked on Mikrotik!']);
    }

    // Unblock client
    public function unblock(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $mk = $this->getMk($client->server);
        $mk->unblockQueueUser($client->username, $client->profile ?? '10000000/10000000');
        $client->update(['status' => 'active']);
        return response()->json(['message' => 'Client unblocked on Mikrotik!']);
    }
}