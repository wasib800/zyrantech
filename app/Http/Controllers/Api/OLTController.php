<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\OLT;
use App\Services\OLTService;
use Illuminate\Http\Request;

class OLTController extends Controller
{
    private function getService($olt): OLTService
    {
        return new OLTService(
            $olt->ip_address,
            $olt->community,
            $olt->port,
            $olt->olt_type ?? 'BDCOM_GPON'
        );
    }

    public function index()
    {
        return response()->json(OLT::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required',
            'ip_address' => 'required',
            'community'  => 'required',
        ]);

        $olt = OLT::create($request->all());
        $svc = $this->getService($olt);
        $connected = $svc->testConnection();
        $olt->update(['status' => $connected ? 'online' : 'offline']);

        return response()->json([
            'message'   => $connected ? 'OLT Connected!' : 'Added but not connected',
            'olt'       => $olt,
            'connected' => $connected,
        ], 201);
    }

    public function destroy($id)
    {
        OLT::findOrFail($id)->delete();
        return response()->json(['message' => 'OLT deleted!']);
    }

    public function stats($id)
    {
        $olt   = OLT::findOrFail($id);
        $svc   = $this->getService($olt);
        $stats = $svc->getStats();
        $olt->update([
            'status'         => $stats['total'] > 0 ? 'online' : 'offline',
            'last_synced_at' => now(),
        ]);
        return response()->json(['olt' => $olt, 'stats' => $stats]);
    }

    public function onus($id)
    {
        $olt = OLT::findOrFail($id);
        $svc = $this->getService($olt);
        return response()->json($svc->getONUList());
    }

    public function sync($id)
    {
        $olt  = OLT::findOrFail($id);
        $svc  = $this->getService($olt);
        $data = $svc->getONUList();

        foreach ($data['onus'] as $onu) {
            \App\Models\OLTUser::updateOrCreate(
                [
                    'o_l_t_id'    => $id,
                    'mac_address' => $onu['mac'] ?: 'ONU-' . $onu['index'],
                ],
                [
                    'name'           => $onu['name'],
                    'rx_power'       => $onu['rx_power'],
                    'distance'       => $onu['distance'],
                    'status'         => $onu['status'],
                    'last_synced_at' => now(),
                ]
            );
        }

        $olt->update([
            'status'         => $data['total'] > 0 ? 'online' : 'offline',
            'last_synced_at' => now(),
            'total_onus'     => $data['total'],
            'online_onus'    => $data['online'],
            'offline_onus'   => $data['offline'],
        ]);

        return response()->json([
            'message' => 'Synced ' . count($data['onus']) . ' ONUs!',
            'total'   => $data['total'],
            'online'  => $data['online'],
            'offline' => $data['offline'],
        ]);
    }
}
