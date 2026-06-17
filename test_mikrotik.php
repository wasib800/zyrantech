<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$client = \App\Models\Client::whereNotNull('mac_address')->first();
echo "Client MAC: " . $client->mac_address . "\n";

$olt = \App\Models\OLTUser::where('mac_address', $client->mac_address)->first();
echo "OLT match: " . ($olt ? $olt->id : 'NOT FOUND') . "\n";

$oltUpper = \App\Models\OLTUser::where('mac_address', strtoupper($client->mac_address))->first();
echo "OLT upper: " . ($oltUpper ? $oltUpper->id : 'NOT FOUND') . "\n";

// Show first 3 OLT MACs
$olts = \App\Models\OLTUser::take(3)->get();
foreach ($olts as $o) {
    echo "OLT MAC: " . $o->mac_address . "\n";
}