<?php
namespace App\Services;

class MikrotikService
{
    private string $ip;
    private string $user;
    private string $pass;
    private int $port;

    public function __construct(string $ip, string $user, string $pass, int $port = 256)
    {
        $this->ip = $ip;
        $this->user = $user;
        $this->pass = $pass;
        $this->port = $port;
    }

    public function request(string $endpoint, string $method = 'GET', array $data = []): array
    {
        $url = "http://{$this->ip}:{$this->port}/rest{$endpoint}";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->user}:{$this->pass}");
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if (!empty($data)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        }
        $response = curl_exec($ch);
        curl_close($ch);
        $result = json_decode($response, true);
        return is_array($result) ? $result : [];
    }

    public function testConnection(): bool
    {
        $result = $this->request('/system/identity');
        return isset($result['name']);
    }

    public function getActiveUsers(): array
    {
        return $this->request('/ppp/active');
    }

    public function getAllUsers(): array
    {
        return $this->request('/ppp/secret');
    }

    public function getQueueClients(): array
    {
        return $this->request('/queue/simple');
    }

    public function syncOnlineStatus(): array
    {
        $active = $this->getActiveUsers();
        return array_column($active, 'name');
    }

    public function blockQueueUser(string $username): bool
    {
        $queues = $this->request('/queue/simple?name=' . urlencode($username));
        if (empty($queues)) return false;
        $id = $queues[0]['.id'];
        $this->request("/queue/simple/{$id}", 'PATCH', ['max-limit' => '1/1']);
        return true;
    }

    public function unblockQueueUser(string $username, string $maxLimit = '10000000/10000000'): bool
    {
        $queues = $this->request('/queue/simple?name=' . urlencode($username));
        if (empty($queues)) return false;
        $id = $queues[0]['.id'];
        $this->request("/queue/simple/{$id}", 'PATCH', ['max-limit' => $maxLimit]);
        return true;
    }

    public function blockUser(string $username): bool
    {
        $users = $this->request('/ppp/secret?name=' . urlencode($username));
        if (empty($users)) return false;
        $id = $users[0]['.id'];
        $this->request("/ppp/secret/{$id}", 'PATCH', ['disabled' => 'true']);
        $this->disconnectUser($username);
        return true;
    }

    public function unblockUser(string $username): bool
    {
        $users = $this->request('/ppp/secret?name=' . urlencode($username));
        if (empty($users)) return false;
        $id = $users[0]['.id'];
        $this->request("/ppp/secret/{$id}", 'PATCH', ['disabled' => 'false']);
        return true;
    }

    public function disconnectUser(string $username): bool
    {
        $active = $this->request('/ppp/active?name=' . urlencode($username));
        if (empty($active)) return false;
        $id = $active[0]['.id'];
        $this->request("/ppp/active/{$id}", 'DELETE');
        return true;
    }
}
