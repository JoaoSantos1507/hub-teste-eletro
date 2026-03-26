<?php
// scripts/Login/login.php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), TRUE);
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

// LISTA OFICIAL ATUALIZADA
$usuarios = [
    [
        "id" => 1, 
        "nome" => "João Santos", 
        "username" => "joao.santos", 
        "senha" => "sJ0r@jt5_", 
        "role" => "Admin master"
    ],
    [
        "id" => 2, 
        "nome" => "Rennan Avelino", 
        "username" => "rennan.avelino", 
        "senha" => "123", 
        "role" => "Terceiro técnico de campo"
    ]
];

foreach ($usuarios as $user) {
    if ($user['username'] === $username && $user['senha'] === $password) {
        unset($user['senha']);
        echo json_encode(['success' => true, 'user' => $user]);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Credenciais inválidas.']);
?>
