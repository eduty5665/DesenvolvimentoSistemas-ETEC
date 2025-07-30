function validaRegistro() {
    var username = document.getElementById('user') 
    var password = document.getElementById('password')
    var email = document.getElementById('email')
    var tel = document.getElementById('tel')
    
    if(username.value == ''){
        Swal.fire('Digite o Username')
    }
    else if(password.value == ''){
        Swal.fire('Digite a Senha')
    }
    else if(email.value == ''){
        Swal.fire('Digite o Email')
    }
    else if(tel.value == ''){
        Swal.fire('Digite seu numero de celular')
    }
    else {
        Swal.fire('Obrigado por confiar no nosso trabalho ;)')
    }
    
}