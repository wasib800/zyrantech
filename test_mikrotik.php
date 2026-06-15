<?php

$ip = '103.224.55.88';
$user = 'Support';
$pass = 'T@nv1r';
$port = 256;

function mkReq($ip, $port, $user, $pass, $endpoint) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://{$ip}:{$port}/rest{$endpoint}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, "{$user}:{$pass}");
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $r = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($r, true);
    return is_array($data) ? $data : [];
}

// Queue list (Static IP clients)
echo "=== QUEUE (Static IP Clients) ===\n";
$queues = mkReq($ip, $port, $user, $pass, '/queue/simple');
echo "Total: " . count($queues) . "\n\n";
foreach ($queues as $q) {
    echo "Name: " . $q['name'] . 
         " | Target: " . $q['target'] . 
         " | Max Limit: " . $q['max-limit'] . "\n";
}

// ARP table
echo "\n=== ARP TABLE ===\n";
$arp = mkReq($ip, $port, $user, $pass, '/ip/arp');
echo "Total: " . count($arp) . "\n\n";
foreach ($arp as $a) {
    echo "IP: " . $a['address'] . 
         " | MAC: " . ($a['mac-address'] ?? 'N/A') . 
         " | Interface: " . ($a['interface'] ?? 'N/A') . "\n";
}