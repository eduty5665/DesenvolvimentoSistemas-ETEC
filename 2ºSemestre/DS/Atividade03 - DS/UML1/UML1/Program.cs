using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Dynamic;
using static UML1.Program;

namespace UML1
{
    class Program
    {
        class Cliente
        {
            private int cpf { get; set; }
            private char nome { get; set; }
            private char telefone { get; set; }
   
            public int MostraCPF()
            {
                return cpf;
            }
            public void VerSaldo(int Saldo)
            {
                Console.WriteLine($"Seu saldo é :{Saldo}");
            }

        }
        class ContaPoupanca
        {
            private int DiaDeposito { get; set; }


            public float VerLucro(int lucro)
            {
                throw new System.NotImplementedException();
            }
        }
        class Conta
        {
            private int Agencia;
            private char ContaCorrente;
  
            public void Depositar(float Deposito)
            {



            }
            public float Slado(int Conta)
            {
                throw new System.NotImplementedException();
            }
        }
    }
}
