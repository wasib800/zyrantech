<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\MikrotikServer;
use App\Models\OLT;
use App\Models\OLTUser;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            // Mikrotik stats
            'total_clients'     => Client::count(),
            'online_clients'    => Client::where('is_online', true)->count(),
            'blocked_clients'   => Client::where('status', 'blocked')->count(),
            'active_clients'    => Client::where('status', 'active')->count(),
            'total_servers'     => MikrotikServer::count(),
            'connected_servers' => MikrotikServer::where('is_connected', true)->count(),

            // OLT stats
            'total_olts'        => OLT::count(),
            'online_olts'       => OLT::where('status', 'online')->count(),
            'total_onus'        => OLTUser::count(),
            'online_onus'       => OLTUser::where('status', 'online')->count(),
            'offline_onus'      => OLTUser::where('status', 'offline')->count(),
        ]);
    }
}