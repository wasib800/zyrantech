<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'mikrotik_server_id', 'olt_user_id',
        'username', 'name', 'phone', 'email',
        'address', 'zone', 'nid',
        'profile', 'ip_address', 'mac_address',
        'connection_type', 'status', 'is_online',
        'monthly_bill', 'bill_date', 'expire_date',
        'auto_disconnect', 'payment_status',
        'last_online_at', 'last_offline_at',
        'blocked_by', 'blocked_at', 'block_reason',
        'notes', 'joined_date',
    ];

    public function server()
    {
        return $this->belongsTo(MikrotikServer::class, 'mikrotik_server_id');
    }

    public function oltUser()
    {
        return $this->belongsTo(OLTUser::class, 'olt_user_id');
    }
}