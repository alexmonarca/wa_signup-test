/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, CheckCircle2, AlertCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';

// --- CONFIGURAÇÕES ---
const FB_APP_ID = '1322580525486349';
const CONFIG_ID = '878421224769472';
const N8N_WEBHOOK_URL = 'https://webhook.monarcahub.com/webhook/whatsapp-setup';

export default function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Carregar o SDK do Facebook
    (window as any).fbAsyncInit = function() {
      (window as any).FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v21.0'
      });
    };

    const script = document.createElement('script');
    script.src = "https://connect.facebook.net/pt_BR/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Listener para a resposta do popup do Facebook
    const handleFBMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP_COMPLETE') {
          handleSignupComplete(data.data);
        }
      } catch (e) {
        // Ignorar mensagens que não são JSON
      }
    };

    window.addEventListener('message', handleFBMessage);
    return () => window.removeEventListener('message', handleFBMessage);
  }, []);

  const launchWhatsAppSignup = () => {
    setStatus('loading');
    
    // @ts-ignore
    if (typeof window.FB === 'undefined') {
      setStatus('error');
      setErrorMessage('O SDK do Facebook não foi carregado corretamente. Verifique bloqueadores de anúncios.');
      return;
    }

    // @ts-ignore
    window.FB.login((response: any) => {
      if (response.authResponse) {
        const code = response.authResponse.code;
        handleSignupComplete({ code });
      } else {
        setStatus('idle');
        console.log('Usuário cancelou o login ou não autorizou totalmente.');
      }
    }, {
      config_id: CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        featureType: 'whatsapp_business_app_onboarding',
        sessionInfoVersion: '3',
        version: 'v3',
        features: [{ name: 'app_only_install' }]
      }
    });
  };

  const handleSignupComplete = async (data: any) => {
    setStatus('loading');
    setDebugInfo(data);

    try {
      // Enviar para o n8n
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          appId: FB_APP_ID,
          timestamp: new Date().toISOString(),
          source: 'monarcahub_onboarding'
        }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        throw new Error('Falha ao comunicar com o servidor de automação.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Ocorreu um erro ao processar sua conexão.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Lado Esquerdo: Info */}
        <div className="p-12 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Círculo de fundo sutil */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <MessageSquare className="text-white w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-2xl font-bold tracking-tight leading-none">monarca<span className="text-brand-primary">hub</span></span>
                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Inteligência Artificial</span>
              </div>
            </div>
            
            <h1 className="text-4xl font-display font-bold leading-tight mb-6">
              Conecte seu WhatsApp <span className="text-brand-primary italic">Oficial</span>
            </h1>
            
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Automatize seus atendimentos com IA utilizando a infraestrutura oficial da Meta. Mais estabilidade e segurança para o seu ecossistema.
            </p>

            <ul className="space-y-4">
              {[
                'API Oficial (Cloud API)',
                'Sem risco de banimento',
                'Múltiplos atendentes simultâneos',
                'Integração nativa com Monarca IA'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 relative z-10">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Parceiro Oficial Meta Business
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="p-12 flex flex-col justify-center items-center text-center bg-white">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <div className="mb-8 p-6 bg-brand-light rounded-3xl inline-block shadow-inner">
                  <MessageSquare className="w-12 h-12 text-brand-primary" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Pronto para escalar?</h2>
                <p className="text-slate-600 mb-10 max-w-xs mx-auto">
                  Vincule sua conta Business agora e libere o poder da automação inteligente.
                </p>
                
                <button
                  onClick={launchWhatsAppSignup}
                  className="w-full py-4 px-6 bg-brand-gradient hover:opacity-90 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/25 active:scale-[0.98]"
                >
                  Conectar com Facebook
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  Ambiente Seguro e Criptografado
                </div>
              </motion.div>
            )}

            {status === 'loading' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <Loader2 className="w-20 h-20 text-brand-primary animate-spin mb-6" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-brand-light rounded-full"></div>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Sincronizando...</h2>
                <p className="text-slate-500 mt-2">Estamos preparando seu ambiente MonarcaHub.</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Sucesso Total!</h2>
                <p className="text-slate-600 mt-3 mb-10 text-center leading-relaxed">
                  Seu WhatsApp foi conectado. A revolução no seu atendimento começa agora.
                </p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                >
                  Acessar Dashboard
                </button>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                  <AlertCircle className="w-14 h-14 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Conexão Interrompida</h2>
                <p className="text-red-500/80 mt-3 mb-10 text-center max-w-xs leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="fixed bottom-8 left-0 right-0 text-center">
        <a 
          href="https://developers.facebook.com/docs/whatsapp/embedded-signup" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 transition-colors"
        >
          Documentação Oficial da Meta <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
