/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, CheckCircle2, AlertCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';

// --- CONFIGURAÇÕES ---
const FB_APP_ID = '1322580525486349';
const CONFIG_ID = '1772141070125396';
const N8N_WEBHOOK_URL = 'https://webhook.monarcahub.com/webhook/whatsapp-setup';

export default function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'record'>('connect');

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fcfcfc]">
      {/* Tabs para alternar entre Conexão e Modo de Gravação */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button 
          onClick={() => setActiveTab('connect')}
          className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'connect' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Conectar
        </button>
        <button 
          onClick={() => setActiveTab('record')}
          className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === 'record' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Modo de Gravação (Meta Review)
        </button>
      </div>

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
            
            {activeTab === 'connect' ? (
              <>
                <h1 className="text-4xl font-display font-bold leading-tight mb-6">
                  Conecte seu WhatsApp <span className="text-brand-primary italic">Oficial</span>
                </h1>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Automatize seus atendimentos com IA utilizando a infraestrutura oficial da Meta. Mais estabilidade e segurança para o seu ecossistema.
                </p>
                <ul className="space-y-4">
                  {['API Oficial (Cloud API)', 'Sem risco de banimento', 'Múltiplos atendentes simultâneos', 'Integração nativa com Monarca IA'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-display font-bold leading-tight mb-6">
                  Área de <span className="text-brand-primary italic">Análise</span>
                </h1>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Use esta área para gravar os vídeos de demonstração exigidos pela Meta para aprovação do seu aplicativo.
                </p>
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <p className="text-sm text-brand-primary font-bold mb-2">Dica de Gravação:</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Filme a tela e o seu celular ao lado para mostrar a mensagem chegando em tempo real. Isso garante a aprovação rápida.
                  </p>
                </div>
              </>
            )}
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
            {activeTab === 'connect' ? (
              <motion.div
                key="connect-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                {status === 'idle' && (
                  <div className="w-full">
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
                  </div>
                )}

                {status === 'loading' && (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Loader2 className="w-20 h-20 text-brand-primary animate-spin mb-6" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-brand-light rounded-full"></div>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Sincronizando...</h2>
                    <p className="text-slate-500 mt-2">Estamos preparando seu ambiente MonarcaHub.</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="flex flex-col items-center">
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
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex flex-col items-center">
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
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="record-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full text-left"
              >
                <div className="space-y-6">
                  {/* Configurações de Teste */}
                  <section className="p-4 bg-brand-light rounded-2xl border border-brand-primary/20">
                    <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Configuração para o Vídeo
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <input 
                        id="phone_id"
                        type="text" 
                        placeholder="Phone Number ID (da Meta)" 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-primary"
                      />
                      <input 
                        id="access_token"
                        type="password" 
                        placeholder="Access Token (Temporário ou Permanente)" 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                      * Estes dados são usados apenas localmente para o disparo do teste no vídeo.
                    </p>
                  </section>

                  {/* Demonstração de Mensagens */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Vídeo 1: Envio de Mensagens</h3>
                    <div className="space-y-3">
                      <input 
                        id="dest_number"
                        type="text" 
                        placeholder="Número do Destinatário (ex: 5511999999999)" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                      />
                      <textarea 
                        id="msg_text"
                        placeholder="Sua mensagem de teste..." 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-20 focus:outline-none focus:border-brand-primary"
                        defaultValue="Olá! Esta é uma mensagem de teste enviada pelo MonarcaHub para validação da API Oficial."
                      ></textarea>
                      <button 
                        onClick={async () => {
                          const phoneId = (document.getElementById('phone_id') as HTMLInputElement).value;
                          const token = (document.getElementById('access_token') as HTMLInputElement).value;
                          const dest = (document.getElementById('dest_number') as HTMLInputElement).value;
                          const text = (document.getElementById('msg_text') as HTMLTextAreaElement).value;

                          if (!phoneId || !token || !dest) {
                            alert('Por favor, preencha o Phone ID, Token e Número de destino.');
                            return;
                          }

                          try {
                            const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                messaging_product: "whatsapp",
                                recipient_type: "individual",
                                to: dest,
                                type: "text",
                                text: { body: text }
                              })
                            });
                            
                            const data = await res.json();
                            if (res.ok) {
                              alert('Mensagem enviada com sucesso! Verifique seu celular agora.');
                            } else {
                              alert('Erro da Meta: ' + (data.error?.message || 'Erro desconhecido'));
                            }
                          } catch (e) {
                            alert('Erro ao conectar com a API da Meta.');
                          }
                        }}
                        className="w-full py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-md hover:opacity-90 transition-all active:scale-[0.98]"
                      >
                        Enviar Mensagem Real
                      </button>
                    </div>
                  </section>

                  <div className="h-px bg-slate-100"></div>

                  {/* Demonstração de Modelos */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Vídeo 2: Gestão de Modelos</h3>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Nome do Modelo (ex: boas_vindas)" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                      />
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary">
                        <option>Marketing</option>
                        <option>Utilidade</option>
                        <option>Autenticação</option>
                      </select>
                      <button 
                        onClick={() => {
                          alert('Simulação: Modelo criado e enviado para análise da Meta!');
                        }}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold"
                      >
                        Criar Novo Modelo
                      </button>
                    </div>
                  </section>
                </div>
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
