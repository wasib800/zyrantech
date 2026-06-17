<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    // Client list with pagination
    public function index(Request $request)
    {
        $query = Client::with('server');

        // Search
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('username', 'like', '%' . $request->search . '%')
                  ->orWhere('name', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhere('ip_address', 'like', '%' . $request->search . '%')
                  ->orWhere('mac_address', 'like', '%' . $request->search . '%')
                  ->orWhere('zone', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by status
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Filter by online
        if ($request->is_online !== null) {
            $query->where('is_online', $request->is_online === 'true');
        }

        // Filter by server
        if ($request->server_id) {
            $query->where('mikrotik_server_id', $request->server_id);
        }

        $clients = $query->orderBy('username')->paginate(50);

        return response()->json($clients);
    }

    // Single client
    public function show($id)
    {
        $client = Client::with(['server', 'oltUser'])->findOrFail($id);
        return response()->json($client);
    }

    // Update client info
    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);

        $client->update([
            'name'         => $request->name,
            'phone'        => $request->phone,
            'email'        => $request->email,
            'address'      => $request->address,
            'zone'         => $request->zone,
            'nid'          => $request->nid,
            'monthly_bill' => $request->monthly_bill,
            'bill_date'    => $request->bill_date,
            'expire_date'  => $request->expire_date,
            'notes'        => $request->notes,
        ]);

        return response()->json([
            'message' => 'Client updated!',
            'client'  => $client,
        ]);
    }

    // Delete client
    public function destroy($id)
    {
        Client::findOrFail($id)->delete();
        return response()->json(['message' => 'Client deleted!']);
    }
}
