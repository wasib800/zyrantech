<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OLT extends Model
{
    protected $fillable = [
        'name', 'ip_address', 'port',
        'community', 'olt_type',
        'status', 'is_active', 'last_synced_at'
    ];

    public function users()
    {
        return $this->hasMany(OLTUser::class, 'o_l_t_id');
    }
}