<?php
// scripts/Login/login.php

// Define que o ficheiro vai devolver dados em formato JSON para o JavaScript ler
header('Content-Type: application/json');

// Recebe os dados enviados pelo JavaScript
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

$username = isset($input['username']) ? trim($input['username']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Validação básica
if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, preencha todos os campos.']);
    exit;
}

// ==========================================================
// BANCO DE DADOS SIMULADO NO SERVIDOR (Seguro)
// O navegador/cliente não tem acesso a este código fonte.
// ==========================================================
$usuarios = [
    [
        "id" => 1, 
        "nome" => "João Santos", 
        "username" => "joao.santos", 
        "senha" => "sJ0r@jt5", // Senha exata que você pediu
        "role" => "Admin master", 
        "status" => "Ativo"
    ],
    [
        "id" => 2, 
        "nome" => "Rennan Avelino", 
        "username" => "rennan.avelino", 
        "senha" => "123456", 
        "role" => "Terceiro técnico de campo", 
        "status" => "Ativo"
    ],
    [
        "id" => 3, 
        "nome" => "David Lima", 
        "username" => "david.lima", 
        "senha" => "123456", 
        "role" => "Terceiro empresa de elevador", 
        "status" => "Ativo"
    ]
];

$usuarioAutenticado = null;
$credenciaisValidas = false;

// Procura o utilizador
foreach ($usuarios as $user) {
    if ($user['username'] === $username) {
        if ($user['senha'] === $password) {
            $credenciaisValidas = true;
            $usuarioAutenticado = $user;
        }
        break; 
    }
}

// Prepara a resposta
if ($credenciaisValidas) {
    if ($usuarioAutenticado['status'] !== 'Ativo') {
        echo json_encode(['success' => false, 'message' => 'A sua conta encontra-se bloqueada.']);
        exit;
    }

    // REGRA DE OURO DE SEGURANÇA: Remover a senha do array antes de enviar a resposta para o frontend
    unset($usuarioAutenticado['senha']);

    echo json_encode([
        'success' => true,
        'user' => $usuarioAutenticado
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'message' => 'Utilizador ou senha incorretos.'
    ]);
}
?>
