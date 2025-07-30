


function loginTeste() {
    var username = document.getElementById('user') 
    var password = document.getElementById('password')
    
    if(username.value != 'isaacarvalho@outlook.com' || password.value != 'TCCsucesso'){
        Swal.fire('Usuario ou senha incorreto!')
    } else {window.location.href='../HTML/index.html'}
}

function esqueciSenha(){
    var esqueciSenha = document.getElementById('esqueciSenha')
    var TelaLogin = document.getElementById('divInput');

    TelaLogin.style.display = 'none';   
    esqueciSenha.style.display = 'flex';
    esqueciSenha.style.flexDirection = 'column'
    esqueciSenha.style.justifyContent = 'center';
    esqueciSenha.style.alignContent = 'center';
}