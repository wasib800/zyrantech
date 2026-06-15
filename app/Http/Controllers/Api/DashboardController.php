<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\MikrotikServer;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_clients' => Client::count(),
            'online_clients' => Client::where('is_online', true)->count(),
            'blocked_clients' => Client::where('status', 'blocked')->count(),
            'active_clients' => Client::where('status', 'active')->count(),
            'total_servers' => MikrotikServer::count(),
            'connected_servers' => MikrotikServer::where('is_connected', true)->count(),
        ]);
    }
}