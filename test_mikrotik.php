<?php
$ip = '192.168.45.2';
$com = 'nmscloud';

$rx = @snmpwalk($ip, $com, '1.3.6.1.4.1.3320.101.10.1.1.80') ?: [];

echo "First 10 raw RX values:\n";
foreach (array_slice($rx, 0, 10) as $i => $v) {
    echo "ONU $i: $v\n";
}