<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OLTUser extends Model
{
    protected $fillable = [
        'o_l_t_id', 'name', 'mac_address',
        'olt_port', 'rx_power', 'distance',
        'status', 'last_synced_at'
    ];

    public function olt()
    {
        return $this->belongsTo(OLT::class, 'o_l_t_id');
    }
}