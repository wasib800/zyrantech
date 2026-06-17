<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('email')->nullable()->after('phone');
            $table->string('address')->nullable()->after('email');
            $table->string('zone')->nullable()->after('address');
            $table->string('nid')->nullable()->after('zone');
            $table->string('connection_type')->default('static')->after('mac_address');
            $table->unsignedBigInteger('olt_user_id')->nullable()->after('mikrotik_server_id');
            $table->integer('bill_date')->default(1)->after('monthly_bill');
            $table->boolean('auto_disconnect')->default(true)->after('bill_date');
            $table->string('payment_status')->default('unpaid')->after('auto_disconnect');
            $table->timestamp('last_offline_at')->nullable()->after('last_online_at');
            $table->string('blocked_by')->nullable()->after('last_offline_at');
            $table->timestamp('blocked_at')->nullable()->after('blocked_by');
            $table->string('block_reason')->nullable()->after('blocked_at');
            $table->text('notes')->nullable()->after('block_reason');
            $table->timestamp('joined_date')->nullable()->after('notes');
        });
    }

    public function down(): void {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'email','address','zone','nid',
                'connection_type','olt_user_id',
                'bill_date','auto_disconnect','payment_status',
                'last_offline_at','blocked_by','blocked_at','block_reason',
                'notes','joined_date'
            ]);
        });
    }
};
