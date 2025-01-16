import React, { useEffect, useState } from "react";
import "./LoadingScreen.css";

const LoadingScreen = () => {
    const [text, setText] = useState(""); // Estado para animação de texto
    const [isOffline, setIsOffline] = useState(false); // Estado para página offline

    const messages = [
        "Verificando atualizações...",
        "Atualizando sistema...",
        "Quase pronto, por favor aguarde..."
    ];

    useEffect(() => {
        let currentMessageIndex = 0;
        let charIndex = 0;
        let timeout;

        const typeWriterEffect = () => {
            if (charIndex < messages[currentMessageIndex].length) {
                setText((prev) => prev + messages[currentMessageIndex][charIndex]);
                charIndex++;
                timeout = setTimeout(typeWriterEffect, 100); // Intervalo entre letras
            } else {
                // Após finalizar a escrita, troca para a próxima mensagem
                setTimeout(() => {
                    charIndex = 0;
                    currentMessageIndex = (currentMessageIndex + 1) % messages.length;
                    setText(""); // Limpa o texto para começar o próximo
                    typeWriterEffect();
                }, 2000); // Espera antes de começar a próxima mensagem
            }
        };

        typeWriterEffect();

        // Limpeza do timeout para evitar vazamento de memória
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        // Detectar se a página está offline
        const handleOffline = () => setIsOffline(!navigator.onLine);

        window.addEventListener("online", handleOffline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOffline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <div className="loading-container">
            <style>
                {`
                    @keyframes blinkCaret {
                    from, to { border-right-color: transparent }
                    50% { border-right-color: white }
                    }
                `}
            </style>
            <div className="spinner"></div>
            {isOffline ? (
                <h2 style={{
                    borderRight: '3px solid white',
                    animation: 'blinkCaret 0.7s step-end infinite'
                    }}>
                    Você está offline. Verifique sua conexão.
                    </h2>
            ) : (
                <>
                    <h2 style={{
                    borderRight: '3px solid white',
                    animation: 'blinkCaret 0.7s step-end infinite'
                    }}>
                    {text}
                    </h2>
                    <p style={{ color: '#ddd' }}>Aguarde enquanto preparamos tudo para você...</p>
                </>
            )}
        </div>
    );
};

export default LoadingScreen;
