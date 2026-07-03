/* ==========================================================================
   ROSA NEGRA — CORE APPLICATION LOGIC (OFFICIAL STORY REWRITE)
   ========================================================================== */

// --- Global Application State ---
const state = {
    investigatorName: "",
    isAuthenticated: false,
    sessionStartTime: null,
    sessionTimerId: null,
    collectedEvidences: new Set(["rosa_negra", "taca_quebrada", "celular_vitima"]),
    sentToLab: {
        "rosa_negra": { status: "pending", progress: 0 },
        "taca_quebrada": { status: "pending", progress: 0 },
        "celular_vitima": { status: "pending", progress: 0 }
    },
    phoneUnlocked: false,
    labUnlocked: false,
    phonePinAttemptsLeft: 5,
    phonePinCode: "2023", // Decrypted PIN
    currentPinAttempt: "",
    activeView: "view-landing",
    viewHistory: [],
    progressPercent: 20,
    selectedEvidenceId: null
};

// --- Official Narrative Database (Scraped) ---
const suspectsData = [
    {
        id: "suspect1",
        name: "Juliana Peixoto",
        age: 24,
        occupation: "Colega de Faculdade",
        relationship: "Estudava na mesma turma que Daniela",
        photo: "suspect1.jpg",
        dossierCode: "FID-SUS-01",
        alibi: "Afirma que estava estudando sozinha em casa na noite do crime.",
        history: "Estudava na mesma turma de Daniela. Conhecida por ser discreta e reservada. Isolou-se completamente após receber a notícia do crime.",
        testimony: "\"Estudávamos na mesma turma e fazíamos trabalhos de grupo. Tivemos algumas discussões sobre notas e tarefas. Ela andava muito estranha nas últimas semanas, participando de fóruns perturbadores sobre comportamento de criminosos na internet. Eu tentei alertá-la, mas ela dizia que as pessoas lá eram mais 'honestas'...\"",
        notes: "Desavenças pessoais e conflitos acadêmicos em trabalhos da faculdade."
    },
    {
        id: "suspect2",
        name: "Bianca Muller",
        age: 23,
        occupation: "Melhor Amiga",
        relationship: "Uma das pessoas mais próximas da vítima",
        photo: "suspect2.jpg",
        dossierCode: "FID-SUS-02",
        alibi: "Afirma que estava em casa dormindo na noite do crime, sem testemunhas.",
        history: "Uma das pessoas mais próximas da vítima. Introvertida e extremamente leal.",
        testimony: "\"Sim, ela andava extremamente tensa e paranoica. Ela me confessou que estava recebendo mensagens anônimas com ameaças dizendo que 'nem toda história fica enterrada'. Ela suspeitava que seu ex-namorado, Michel Newton, a estivesse vigiando.\"",
        notes: "Conhecimento de segredos da vítima ou desentendimentos ocultos."
    },
    {
        id: "suspect3",
        name: "Giselle",
        age: 44,
        occupation: "Mãe / Empresária de Cosméticos",
        relationship: "Mãe de Daniela, proprietária de empresa de cosméticos",
        photo: "suspect3.jpg",
        dossierCode: "FID-SUS-03",
        alibi: "Estava em seu quarto no Hotel Palace. O check-in confirma sua entrada às 21:00.",
        history: "Mãe de Daniela, proprietária de uma conhecida empresa de cosméticos. Elegante, controlada, reservada e busca evitar conflitos públicos.",
        testimony: "\"Vim tratar de assuntos comerciais da minha marca de cosméticos e tentar convencer Daniela a não revelar certas informações familiares sigilosas. Nós andávamos muito distantes. Eu pretendia encontrá-la no dia seguinte. Fiz o check-in no Hotel Palace por volta das 21:00 e fui direto para o meu quarto. As câmeras do hotel confirmam que não saí de lá.\"",
        notes: "Conflitos familiares graves e segredos profundos do passado da família."
    },
    {
        id: "suspect4",
        name: "Vitor",
        age: 20,
        occupation: "Irmão-postiço",
        relationship: "Filho do falecido padrasto da vítima",
        photo: "suspect4.jpg",
        dossierCode: "FID-SUS-04",
        alibi: "Alega que estava no Hotel Palace na noite do crime, em outro quarto.",
        history: "Passou a viver com a madrasta após a morte do pai. Demonstra antipatia por Daniela. Personalidade fechada, poucas amizades, costumava descrever Daniela como manipuladora.",
        testimony: "\"Sim, ela era insuportável, egoísta e vivia chantageando a minha madrasta, Giselle, ameaçando expor a herança do meu pai. Eu estava hospedado no mesmo hotel que Giselle. Fui direto dormir e só soube da tragédia na manhã seguinte. Eu mandei mensagem para ela perguntando se ela iria ao hotel. Eu queria resolver a situação de uma vez por todas.\"",
        notes: "Ressentimento familiar e ódio pessoal acumulado. *Nota Pericial: Suspeito principal.*"
    },
    {
        id: "suspect5",
        name: "Ingrid",
        age: 25,
        occupation: "Colega de Quarto",
        relationship: "Dividia apartamento com Daniela",
        photo: "suspect5.jpg",
        dossierCode: "FID-SUS-05",
        alibi: "Afirma que chegou em casa por volta das 02:00 e ligou para a polícia.",
        history: "Dividia apartamento com Daniela. Foi quem encontrou o corpo da vítima. Extrovertida, comunicativa, fã de true crime e documentários investigativos.",
        testimony: "\"Eu saí para jantar com amigos e retornei por volta das 02:00. A porta do apartamento estava destrancada. Quando entrei na cozinha, vi a banqueta derrubada, fragmentos de vidro no chão e Daniela caída. Entrei em pânico e liguei imediatamente para o 190.\"",
        notes: "Conflitos de convivência, segredos compartilhados ou informações omitidas."
    },
    {
        id: "suspect6",
        name: "Michel Newton",
        age: 26,
        occupation: "Músico / Ex-namorado",
        relationship: "Ex-namorado da vítima com histórico de ciúmes",
        photo: "suspect6.jpg",
        dossierCode: "FID-SUS-06",
        alibi: "Alega que estava bebendo sozinho no Bar do Bilhar das 21:00 às 02:00.",
        history: "Músico com histórico de ciúmes intensos e comportamento agressivo. Medida protetiva de urgência estava em andamento.",
        testimony: "\"Sim, ela terminou comigo repentinamente e me bloqueou de tudo. Eu admito que perdi o controle algumas vezes e fui atrás dela. Eu fui até lá sim! Eu vi quando a Ingrid saiu e mandei as mensagens. Mas eu juro por Deus que ela não abriu a porta! Eu não entrei no apartamento!\"",
        notes: "Ciúmes doentios e inconformidade com o fim abrupto do relacionamento."
    }
];

const evidenceData = {
    "rosa_negra": {
        id: "rosa_negra",
        title: "A Rosa Negra",
        description: "Uma rosa negra foi encontrada posicionada acima da vítima, perfeitamente alinhada ao peito, indicando que sua colocação foi intencional. Sugere uma assinatura simbólica.",
        analysisDetails: {
            "Tipo": "Rosa natural tingida de preto com tinta spray acrílica.",
            "Traços Químicos": "Identificado o adubo patenteado 'Phos-Grow 4' (proibido pelo IBAMA em 2022).",
            "Estufa Licenciada": "Apenas a Floricultura Flor de Newton possui estoque residual deste adubo.",
            "Conclusão": "A flor foi colhida e tingida, apontando conexão com a estufa da família de Michel Newton."
        }
    },
    "taca_quebrada": {
        id: "taca_quebrada",
        title: "Fragmento de Vidro",
        description: "Um fragmento de vidro foi encontrado próximo ao corpo, com bordas irregulares e manchas vermelhas.",
        analysisDetails: {
            "DNA": "Compatível com o sangue da vítima Daniela Alborghetti.",
            "Formato": "Retirado de uma taça quebrada durante luta física.",
            "Uso": "Utilizado para desferir o golpe perfurocortante fatal no pescoço.",
            "Conclusão": "Arma do crime que causou a hemorragia cervical fatal."
        }
    },
    "celular_vitima": {
        id: "celular_vitima",
        title: "Celular de Daniela",
        description: "Um celular com a tela parcialmente trincada encontrado ao lado da cena do crime.",
        analysisDetails: {
            "Decodificação": "Bypass concluído via PIN 2023.",
            "Log de Chamadas": "Múltiplas chamadas perdidas da mãe (Giselle) e ex-namorado.",
            "Arquivos": "Armazenava arquivos contendo provas de desvios fiscais da herança familiar.",
            "Conclusão": "Aparelho contém as últimas interações cruciais da vítima antes de morrer."
        }
    }
};

const autopsyData = {
    "head": {
        title: "Região Occipital (Nuca) - Contusão Traumática",
        severity: "GRAVE",
        description: "Lesão contusa leve na região occipital esquerda (nuca), compatível com choque mecânico contra a quina de mármore da bancada.",
        relation: "Indica que ela colidiu com a quina antes de atingir o chão durante a queda fatal."
    },
    "neck": {
        title: "Pescoço — Lesão Perfurocortante",
        severity: "CRÍTICO",
        description: "Lesão de 3,5 cm de extensão na região cervical anterior, com infiltração hemorrágica vital e trajetória descendente.",
        relation: "Causada pelo golpe direto com o 'Fragmento de Vidro' pontiagudo da taça quebrada."
    },
    "lips": {
        title: "Lábios e Extremidades - Cianose Asfíxica",
        severity: "CRÍTICO",
        description: "Cianose intensa em extremidades corporais e lábios azulados. Odor de amêndoas amargas na cavidade torácica.",
        relation: "Presença de intoxicação sistêmica aguda por cianeto de potássio, bloqueando oxigenação celular celular rápida."
    },
    "wrist": {
        title: "Punho Direito - Escoriações de Contenção",
        severity: "MODERADO",
        description: "Pequenas escoriações lineares sugerindo aperto violento por terceiros.",
        relation: "A vítima arranhou o agressor. Coletados micro-fragmentos de fibras de tecido de lã cinza sob suas unhas."
    },
    "thigh": {
        title: "Coxa Direita — Equimose (Hematoma)",
        severity: "MODERADO",
        description: "Hematoma de 6,0 cm x 4,0 cm na coxa, compatível com trauma contuso ocorrido entre 2 e 12 horas antes da morte.",
        relation: "Evidência física de luta corporal ou empurrão severo anterior ao ataque fatal."
    }
};

const victimPhoneData = {
    chats: [
        {
            id: "suspect1",
            name: "Juliana Peixoto",
            lastMsg: "Boa noite.",
            time: "22:18",
            unread: false,
            messages: [
                { isHeader: true, text: "10 de Setembro de 2023" },
                { sender: "received", text: "Você falou sério aquilo que me disse hoje?", time: "20:14" },
                { sender: "sent", text: "Sobre o quê?", time: "20:16" },
                { sender: "received", text: "Você sabe muito bem.", time: "20:17" },
                { sender: "sent", text: "Não estou a fim de jogar adivinhação.", time: "20:18" },
                { sender: "received", text: "Sobre contar aquilo para as pessoas.", time: "20:20" },
                { sender: "sent", text: "Ainda estou pensando.", time: "20:21" },
                { sender: "received", text: "Daniela, por favor.", time: "20:22" },
                { sender: "sent", text: "Por favor o quê?", time: "20:23" },
                { sender: "received", text: "Não faz isso.", time: "20:24" },
                { sender: "sent", text: "Você está muito nervosa.", time: "20:25" },
                { sender: "received", text: "Porque isso não afeta só você.", time: "20:25" },
                { sender: "sent", text: "Talvez algumas verdades precisem aparecer.", time: "20:27" },
                { sender: "received", text: "Nem tudo precisa ser exposto.", time: "20:28" },
                { sender: "sent", text: "Fácil falar quando não é você carregando isso.", time: "20:29" },
                { isHeader: true, text: "20:45" },
                { sender: "received", text: "Você mudou muito.", time: "20:45" },
                { sender: "sent", text: "As pessoas mudam.", time: "20:46" },
                { sender: "received", text: "Não foi isso que eu quis dizer.", time: "20:48" },
                { sender: "sent", text: "Então diga.", time: "20:49" },
                { sender: "received", text: "Você parece gostar de ver as pessoas desesperadas.", time: "20:50" },
                { sender: "sent", text: "Nossa.", time: "20:52" },
                { sender: "received", text: "É verdade.", time: "20:53" },
                { sender: "sent", text: "Talvez eu só tenha parado de proteger todo mundo.", time: "20:55" },
                { sender: "received", text: "Você está brincando com fogo.", time: "20:57" },
                { sender: "sent", text: "Engraçado você dizer isso.", time: "20:59" },
                { isHeader: true, text: "21:03" },
                { sender: "received", text: "Você ainda entra naqueles fóruns estranhos?", time: "21:03" },
                { sender: "sent", text: "Às vezes.", time: "21:05" },
                { sender: "received", text: "Isso não é normal.", time: "21:06" },
                { sender: "sent", text: "Lá as pessoas são mais honestas do que na vida real.", time: "21:07" },
                { sender: "received", text: "São fóruns sobre assassinos.", time: "21:09" },
                { sender: "sent", text: "São fóruns sobre comportamento humano.", time: "21:10" },
                { sender: "received", text: "Você sempre encontra uma forma de justificar tudo.", time: "21:12" },
                { isHeader: true, text: "Últimas mensagens — 22:11" },
                { sender: "received", text: "Promete que não vai fazer nenhuma loucura?", time: "22:11" },
                { sender: "sent", text: "Que tipo de loucura?", time: "22:13" },
                { sender: "received", text: "Você sabe do que estou falando.", time: "22:13" },
                { sender: "sent", text: "Relaxa.", time: "22:14" },
                { sender: "received", text: "Não estou relaxada.", time: "22:15" },
                { sender: "sent", text: "Você se preocupa demais.", time: "22:16" },
                { sender: "received", text: "E você de menos.", time: "22:17" },
                { sender: "sent", text: "Boa noite, Ju.", time: "22:18" },
                { sender: "received", text: "Boa noite.", time: "22:18" }
            ]
        },
        {
            id: "suspect2",
            name: "Bianca Muller",
            lastMsg: "Boa noite, Bia.",
            time: "22:15",
            unread: false,
            messages: [
                { isHeader: true, text: "6 de Setembro de 2023" },
                { sender: "received", text: "Chegou em casa?", time: "21:04" },
                { sender: "sent", text: "Cheguei.", time: "21:05" },
                { sender: "received", text: "E aí? Como foi?", time: "21:05" },
                { sender: "sent", text: "Estranho.", time: "21:06" },
                { sender: "received", text: "O jantar com sua mãe?", time: "21:07" },
                { sender: "sent", text: "Também.", time: "21:08" },
                { sender: "received", text: "Também?", time: "21:08" },
                { sender: "sent", text: "Depois eu te conto.", time: "21:09" },
                { isHeader: true, text: "21:15" },
                { sender: "received", text: "Você anda escondendo muita coisa.", time: "21:15" },
                { sender: "sent", text: "Talvez.", time: "21:16" },
                { sender: "received", text: "Isso me preocupa.", time: "21:17" },
                { sender: "sent", text: "Você se preocupa demais.", time: "21:18" },
                { sender: "received", text: "Alguém precisa.", time: "21:18" },
                { sender: "sent", text: "Eu me viro.", time: "21:19" },
                { sender: "received", text: "Nem sempre.", time: "21:20" },
                { isHeader: true, text: "21:22" },
                { sender: "sent", text: "Recebi mais uma mensagem.", time: "21:22" },
                { sender: "received", text: "Daquela conta estranha?", time: "21:23" },
                { sender: "sent", text: "Sim.", time: "21:24" },
                { sender: "received", text: "O que dizia?", time: "21:24" },
                { sender: "sent", text: "Nem toda história fica enterrada.", time: "21:25" },
                { sender: "received", text: "Isso não é normal.", time: "21:26" },
                { sender: "sent", text: "Provavelmente alguém tentando me assustar.", time: "21:27" },
                { sender: "received", text: "Ou alguém querendo te avisar de alguma coisa.", time: "21:28" },
                { sender: "sent", text: "Você anda vendo muitos documentários.", time: "21:29" },
                { isHeader: true, text: "21:31" },
                { sender: "received", text: "Você mostrou isso para a polícia?", time: "21:31" },
                { sender: "sent", text: "Claro que não.", time: "21:32" },
                { sender: "received", text: "Deveria.", time: "21:33" },
                { sender: "sent", text: "Não vou fazer um boletim de ocorrência por causa de mensagens anônimas.", time: "21:34" },
                { sender: "received", text: "Você não sabe quem está mandando.", time: "21:36" },
                { sender: "sent", text: "Nem você.", time: "21:37" },
                { isHeader: true, text: "21:40" },
                { sender: "received", text: "Dani...", time: "21:40" },
                { sender: "sent", text: "O quê?", time: "21:41" },
                { sender: "received", text: "Tem gente que não gosta de você.", time: "21:41" },
                { sender: "sent", text: "Nossa, obrigada pela novidade.", time: "21:42" },
                { sender: "received", text: "Estou falando sério.", time: "21:43" },
                { sender: "sent", text: "Eu também.", time: "21:44" },
                { sender: "received", text: "Promete que vai tomar cuidado?", time: "21:44" },
                { sender: "sent", text: "Prometo.", time: "21:45" },
                { isHeader: true, text: "Últimas mensagens — 22:13" },
                { sender: "received", text: "Se acontecer qualquer coisa, me liga.", time: "22:13" },
                { sender: "sent", text: "Você fala como se eu estivesse em perigo.", time: "22:14" },
                { sender: "received", text: "Só estou sendo sua amiga.", time: "22:14" },
                { sender: "sent", text: "Eu sei ❤️", time: "22:15" },
                { sender: "received", text: "Boa noite.", time: "22:15" },
                { sender: "sent", text: "Boa noite, Bia.", time: "22:15" }
            ]
        },
        {
            id: "suspect3",
            name: "Giselle (Mãe)",
            lastMsg: "Boa noite.",
            time: "22:40",
            unread: false,
            messages: [
                { isHeader: true, text: "10 de Setembro de 2023" },
                { sender: "received", text: "Chegamos na cidade.", time: "16:08" },
                { sender: "sent", text: "Já?", time: "16:09" },
                { sender: "received", text: "Seu irmão quis vir junto.", time: "16:10" },
                { sender: "sent", text: "Que ótimo...", time: "16:11" },
                { sender: "received", text: "Daniela.", time: "16:11" },
                { sender: "sent", text: "O quê?", time: "16:12" },
                { sender: "received", text: "Não começa.", time: "16:13" },
                { sender: "sent", text: "Eu não comecei nada.", time: "16:14" },
                { sender: "received", text: "Então vamos manter a paz pelo menos uma vez.", time: "16:15" },
                { sender: "sent", text: "Depende dele.", time: "16:16" },
                { sender: "received", text: "Depende de vocês dois.", time: "16:17" },
                { isHeader: true, text: "18:42" },
                { sender: "received", text: "Vamos jantar hoje?", time: "18:42" },
                { sender: "sent", text: "Posso.", time: "18:43" },
                { sender: "received", text: "Sem discussões.", time: "18:44" },
                { sender: "sent", text: "Sem promessas.", time: "18:45" },
                { sender: "received", text: "Você acha engraçado?", time: "18:45" },
                { sender: "sent", text: "Não.", time: "18:46" },
                { sender: "received", text: "Porque eu estou cansada de apagar incêndios nessa família.", time: "18:47" },
                { sender: "sent", text: "Talvez porque existam coisas que nunca deveriam ter sido escondidas.", time: "18:48" },
                { sender: "received", text: "Daniela...", time: "18:49" },
                { sender: "sent", text: "O quê?", time: "18:49" },
                { sender: "received", text: "Não faça isso.", time: "18:50" },
                { sender: "sent", text: "Fazer o quê?", time: "18:51" },
                { sender: "received", text: "Trazer o passado de volta.", time: "18:52" },
                { isHeader: true, text: "19:01" },
                { sender: "sent", text: "Você sabe que uma hora todo mundo vai descobrir.", time: "19:01" },
                { sender: "received", text: "Não por você.", time: "19:02" },
                { sender: "sent", text: "Você ainda está tentando controlar tudo.", time: "19:03" },
                { sender: "received", text: "Estou tentando proteger nossa família.", time: "19:04" },
                { sender: "sent", text: "Proteger ou esconder?", time: "19:04" },
                { sender: "received", text: "Chega.", time: "19:05" },
                { sender: "sent", text: "Você sempre faz isso quando não tem resposta.", time: "19:06" },
                { sender: "received", text: "Conversaremos pessoalmente.", time: "19:07" },
                { isHeader: true, text: "Última mensagem — 22:36" },
                { sender: "received", text: "Chegou em casa?", time: "22:36" },
                { sender: "sent", text: "Ainda não.", time: "22:37" },
                { sender: "received", text: "Me avise quando chegar.", time: "22:37" },
                { sender: "sent", text: "Pode deixar.", time: "22:38" },
                { sender: "received", text: "Boa noite, filha.", time: "22:39" },
                { sender: "sent", text: "Boa noite.", time: "22:40" }
            ]
        },
        {
            id: "suspect4",
            name: "Vitor (Irmão-postiço)",
            lastMsg: "kkkk",
            time: "20:44",
            unread: false,
            messages: [
                { isHeader: true, text: "10 de Setembro de 2023" },
                { sender: "sent", text: "Vocês já chegaram?", time: "17:12" },
                { sender: "received", text: "Sim.", time: "17:15" },
                { sender: "sent", text: "E a viagem?", time: "17:15" },
                { sender: "received", text: "Normal.", time: "17:16" },
                { sender: "sent", text: "Tá no hotel?", time: "17:17" },
                { sender: "received", text: "Tô.", time: "17:17" },
                { sender: "sent", text: "Beleza.", time: "17:18" },
                { isHeader: true, text: "Algumas horas depois" },
                { sender: "received", text: "Você vem mesmo?", time: "20:41" },
                { sender: "sent", text: "Vou tentar.", time: "20:42" },
                { sender: "received", text: "👍", time: "20:42" },
                { sender: "sent", text: "Nossa, que empolgação.", time: "20:43" },
                { sender: "received", text: "😐", time: "20:43" },
                { sender: "sent", text: "kkkk", time: "20:44" }
            ]
        },
        {
            id: "suspect5",
            name: "Ingrid (Roommate)",
            lastMsg: "Boa noite ❤️",
            time: "22:48",
            unread: false,
            messages: [
                { isHeader: true, text: "10 de Setembro de 2023" },
                { sender: "received", text: "Você vai sair hoje?", time: "18:27" },
                { sender: "sent", text: "Vou.", time: "18:28" },
                { sender: "received", text: "Com quem?", time: "18:29" },
                { sender: "sent", text: "Curiosa.", time: "18:30" },
                { sender: "received", text: "Estou perguntando.", time: "18:30" },
                { sender: "sent", text: "Talvez eu conte depois.", time: "18:31" },
                { sender: "received", text: "Ou talvez não exista ninguém.", time: "18:32" },
                { sender: "sent", text: "Nossa, que mau humor.", time: "18:33" },
                { sender: "received", text: "Você anda estranha faz semanas.", time: "18:34" },
                { sender: "sent", text: "Todo mundo fala isso.", time: "18:35" },
                { sender: "received", text: "Porque é verdade.", time: "18:36" },
                { isHeader: true, text: "18:58" },
                { sender: "received", text: "Posso te perguntar uma coisa?", time: "18:58" },
                { sender: "sent", text: "Depende.", time: "18:59" },
                { sender: "received", text: "Você ficou com o Lucas?", time: "19:00" },
                { sender: "sent", text: "Quem te contou isso?", time: "19:00" },
                { sender: "received", text: "Então ficou.", time: "19:01" },
                { sender: "sent", text: "Ingrid...", time: "19:01" },
                { sender: "received", text: "Era meu melhor amigo.", time: "19:01" },
                { sender: "sent", text: "Vocês nem estavam se falando mais.", time: "19:02" },
                { sender: "received", text: "Não muda nada.", time: "19:02" },
                { sender: "sent", text: "Eu não fiz por mal.", time: "19:02" },
                { sender: "received", text: "Você nunca faz por mal, né?", time: "19:02" },
                { isHeader: true, text: "19:02" },
                { sender: "sent", text: "Você está exagerando.", time: "19:02" },
                { sender: "received", text: "Estou?", time: "19:03" },
                { sender: "sent", text: "Sim.", time: "19:03" },
                { sender: "received", text: "Às vezes parece que você gosta de testar os limites das pessoas.", time: "19:04" },
                { sender: "sent", text: "Drama.", time: "19:05" },
                { sender: "received", text: "Não é drama.", time: "19:06" },
                { sender: "sent", text: "Já passou.", time: "19:07" },
                { sender: "received", text: "Para você.", time: "19:08" },
                { isHeader: true, text: "19:11" },
                { sender: "received", text: "Você já percebeu quantas pessoas se afastaram de você ultimamente?", time: "19:11" },
                { sender: "sent", text: "Nem todas as amizades duram para sempre.", time: "19:13" },
                { sender: "received", text: "Não estou falando só de amizades.", time: "19:14" },
                { sender: "sent", text: "Então fala logo o que quer dizer.", time: "19:15" },
                { sender: "received", text: "Nada.", time: "19:16" },
                { sender: "sent", text: "Achei.", time: "19:17" },
                { isHeader: true, text: "19:20" },
                { sender: "received", text: "Só toma cuidado.", time: "19:20" },
                { sender: "sent", text: "Com o quê?", time: "19:21" },
                { sender: "received", text: "Com as coisas que você fala.", time: "19:22" },
                { sender: "sent", text: "Isso foi uma ameaça?", time: "19:23" },
                { sender: "received", text: "Claro que não.", time: "19:24" },
                { sender: "sent", text: "Então pareceu.", time: "19:25" },
                { sender: "received", text: "Estou tentando te dar um conselho.", time: "19:26" },
                { sender: "sent", text: "Que fofa.", time: "19:27" },
                { sender: "received", text: "Você é impossível.", time: "19:28" },
                { isHeader: true, text: "Últimas mensagens — 22:47" },
                { sender: "received", text: "Vou sair agora.", time: "22:47" },
                { sender: "sent", text: "Boa sorte no encontro.", time: "22:47" },
                { sender: "received", text: "Obrigada.", time: "22:48" },
                { sender: "sent", text: "Depois me conta se ele é bonito.", time: "22:48" },
                { sender: "received", text: "Se você estiver acordada quando eu voltar.", time: "22:48" },
                { sender: "sent", text: "Estarei.", time: "22:48" },
                { sender: "received", text: "Boa noite, Dani.", time: "22:48" },
                { sender: "sent", text: "Boa noite ❤️", time: "22:48" }
            ]
        },
        {
            id: "suspect6",
            name: "Michel Newton",
            lastMsg: "A gente ainda vai conversar.",
            time: "19:15",
            unread: false,
            messages: [
                { isHeader: true, text: "8 de Setembro de 2023" },
                { sender: "received", text: "Você vai continuar me ignorando?", time: "22:17" },
                { sender: "sent", text: "Não estou te ignorando, Michael.", time: "22:21" },
                { sender: "received", text: "Engraçado. Porque parece.", time: "22:21" },
                { sender: "sent", text: "A gente terminou há meses. Não preciso responder na mesma hora.", time: "22:23" },
                { sender: "received", text: "Mas você responde todo mundo menos eu.", time: "22:24" },
                { sender: "sent", text: "Você tá vendo? É exatamente por isso que eu terminei.", time: "22:25" },
                { sender: "received", text: "Porque eu me importava?", time: "22:26" },
                { sender: "sent", text: "Porque você queria controlar tudo.", time: "22:27" },
                { sender: "received", text: "Você sempre exagera.", time: "22:28" },
                { sender: "sent", text: "Não vou discutir isso de novo.", time: "22:30" },
                { sender: "received", text: "Então me explica por que estava com aquele cara na faculdade.", time: "22:31" },
                { sender: "sent", text: "Isso não é da sua conta.", time: "22:32" },
                { sender: "received", text: "Claro que é.", time: "22:33" },
                { sender: "sent", text: "Não, não é.", time: "22:34" },
                { sender: "received", text: "Você me substituiu rápido.", time: "22:35" },
                { sender: "sent", text: "Michael, segue sua vida.", time: "22:36" },
                { sender: "received", text: "Talvez eu tentasse se você parasse de aparecer em todo lugar.", time: "22:37" },
                { sender: "sent", text: "A cidade não gira ao seu redor.", time: "22:38" },
                { sender: "received", text: "Nem ao seu.", time: "22:39" },
                { sender: "sent", text: "Boa noite.", time: "22:40" },
                { isHeader: true, text: "9 de Setembro de 2023" },
                { sender: "received", text: "A gente precisa conversar pessoalmente.", time: "18:54" },
                { sender: "sent", text: "Não.", time: "18:56" },
                { sender: "received", text: "Cinco minutos.", time: "18:57" },
                { sender: "sent", text: "Já falei tudo o que tinha pra falar.", time: "18:59" },
                { sender: "received", text: "Tem coisas que você esconde de todo mundo.", time: "19:01" },
                { sender: "sent", text: "O que isso significa?", time: "19:02" },
                { sender: "received", text: "Você sabe.", time: "19:04" },
                { sender: "sent", text: "Se for ameaça, estou tirando print.", time: "19:05" },
                { sender: "received", text: "Não é ameaça.", time: "19:07" },
                { sender: "sent", text: "Então para de agir como se fosse.", time: "19:08" },
                { sender: "received", text: "Só toma cuidado com as pessoas em quem você confia.", time: "19:10" },
                { sender: "sent", text: "Tá ficando estranho.", time: "19:11" },
                { sender: "received", text: "Talvez você devesse se preocupar mais com o que fez do que comigo.", time: "19:12" },
                { sender: "sent", text: "Adeus, Michael.", time: "19:14" },
                { sender: "received", text: "A gente ainda vai conversar.", time: "19:15" }
            ]
        },
        {
            id: "unknown",
            name: "Desconhecido",
            lastMsg: "Mensagem visualizada às 23:55",
            time: "23:55",
            unread: true,
            messages: [
                { isHeader: true, text: "28 de Agosto de 2023" },
                { sender: "received", text: "Você já contou para alguém o que fez com a Ingrid?", time: "21:05" },
                { sender: "sent", text: "Quem é você?", time: "21:06" },
                { sender: "received", text: "Responde a pergunta.", time: "21:07" },
                { sender: "sent", text: "Não sei do que está falando.", time: "21:08" },
                { sender: "received", text: "Você ficou com o melhor amigo dela sabendo que isso destruiria a amizade dos dois.", time: "21:10" },
                { sender: "sent", text: "Isso não é da sua conta.", time: "21:11" },
                { sender: "received", text: "Mas aconteceu.", time: "21:12" },
                { isHeader: true, text: "30 de Agosto de 2023" },
                { sender: "received", text: "E sobre sua mãe?", time: "21:35" },
                { sender: "sent", text: "Para.", time: "21:36" },
                { sender: "received", text: "Ela sabe de tudo?", time: "21:37" },
                { sender: "sent", text: "Não.", time: "21:37" },
                { sender: "received", text: "Achei que não.", time: "21:38" },
                { sender: "received", text: "Você deixou ela acreditar em uma versão conveniente durante anos.", time: "21:39" },
                { sender: "sent", text: "Você não entende nada da minha vida.", time: "21:40" },
                { sender: "received", text: "Entendo mais do que você imagina.", time: "21:41" },
                { isHeader: true, text: "1 de Setembro de 2023" },
                { sender: "received", text: "Você gosta de falar sobre justiça na internet.", time: "21:50" },
                { sender: "sent", text: "E daí?", time: "21:51" },
                { sender: "received", text: "Defendendo assassinos.", time: "21:52" },
                { sender: "received", text: "Tratando criminosos como vítimas.", time: "21:53" },
                { sender: "sent", text: "Você está exagerando.", time: "21:54" },
                { sender: "received", text: "Você passava horas defendendo pessoas que destruíram vidas.", time: "21:55" },
                { sender: "sent", text: "Era só discussão.", time: "21:56" },
                { sender: "received", text: "Para você sempre é \"só\".", time: "21:57" },
                { isHeader: true, text: "3 de Setembro de 2023" },
                { sender: "received", text: "Você sabe qual é o problema?", time: "22:00" },
                { sender: "sent", text: "Qual?", time: "22:01" },
                { sender: "received", text: "Você acha que as consequências nunca chegam.", time: "22:02" },
                { sender: "sent", text: "Nossa.", time: "22:03" },
                { sender: "received", text: "Você magoa alguém.", time: "22:04" },
                { sender: "received", text: "Pede desculpas.", time: "22:04" },
                { sender: "received", text: "E segue em frente.", time: "22:05" },
                { sender: "received", text: "Enquanto os outros ficam com os pedaços.", time: "22:06" },
                { isHeader: true, text: "5 de Setembro de 2023" },
                { sender: "received", text: "Você já pensou no seu irmão?", time: "22:10" },
                { sender: "sent", text: "Não fala dele.", time: "22:11" },
                { sender: "received", text: "Por quê?", time: "22:12" },
                { sender: "sent", text: "Porque não.", time: "22:13" },
                { sender: "received", text: "Você sempre tratou os sentimentos dos outros como se fossem exagero.", time: "22:14" },
                { sender: "sent", text: "Chega.", time: "22:15" },
                { isHeader: true, text: "7 de Setembro de 2023" },
                { sender: "received", text: "Você tem medo de quê?", time: "22:20" },
                { sender: "sent", text: "De nada.", time: "22:21" },
                { sender: "received", text: "Mentira.", time: "22:22" },
                { sender: "received", text: "Você tem medo que alguém conte quem você realmente é.", time: "22:23" },
                { sender: "sent", text: "Quem eu realmente sou?", time: "22:24" },
                { sender: "received", text: "Uma pessoa que faz escolhas e deixa os outros lidarem com as consequências.", time: "22:25" },
                { isHeader: true, text: "9 de Setembro de 2023" },
                { sender: "received", text: "Você se lembra do que disse uma vez?", time: "22:30" },
                { sender: "sent", text: "Não.", time: "22:31" },
                { sender: "received", text: "\"Se ninguém descobrir, não importa.\"", time: "22:32" },
                { sender: "sent", text: "Eu nunca disse isso.", time: "22:33" },
                { sender: "received", text: "Disse.", time: "22:34" },
                { sender: "received", text: "E foi aí que percebi que você nunca mudaria.", time: "22:35" },
                { isHeader: true, text: "11 de Setembro de 2023" },
                { sender: "received", text: "Duas semanas.", time: "23:11" },
                { sender: "sent", text: "O quê?", time: "23:12" },
                { sender: "received", text: "Duas semanas tentando fazer você admitir.", time: "23:13" },
                { sender: "sent", text: "Admitir o quê?", time: "23:14" },
                { sender: "received", text: "Que você machucou pessoas.", time: "23:15" },
                { sender: "received", text: "Que mentiu.", time: "23:15" },
                { sender: "received", text: "Que escondeu coisas.", time: "23:16" },
                { sender: "received", text: "Que nunca se importou com as consequências.", time: "23:17" },
                { sender: "sent", text: "Você não sabe nada sobre mim.", time: "23:18" },
                { sender: "received", text: "Não?", time: "23:19" },
                { sender: "received", text: "Eu sei da Ingrid.", time: "23:20" },
                { sender: "received", text: "Eu sei das mentiras que você contou para sua mãe.", time: "23:21" },
                { sender: "received", text: "Eu sei das pessoas que você descartou quando deixaram de ser úteis.", time: "23:22" },
                { sender: "received", text: "Eu sei quem você é quando ninguém está olhando.", time: "23:23" },
                { sender: "sent", text: "Quem é você?", time: "23:24" },
                { sender: "received", text: "Alguém que cansou de ver você escapar.", time: "23:25" },
                { sender: "sent", text: "Você está me ameaçando?", time: "23:26" },
                { sender: "received", text: "Não.", time: "23:27" },
                { sender: "received", text: "Estou avisando.", time: "23:28" },
                { isHeader: true, text: "Última mensagem — 23:54" },
                { sender: "received", text: "Você passou anos controlando a narrativa.", time: "23:54" },
                { sender: "received", text: "Escolhendo o que as pessoas podiam saber.", time: "23:54" },
                { sender: "received", text: "Escolhendo quais verdades deveriam morrer.", time: "23:55" },
                { sender: "received", text: "Mas segredos não desaparecem.", time: "23:55" },
                { sender: "received", text: "Eles apodrecem.", time: "23:55" },
                { sender: "received", text: "E, quando finalmente vêm à tona...", time: "23:55" },
                { sender: "received", text: "Levam tudo junto.", time: "23:55" },
                { isHeader: true, text: "Mensagem visualizada às 23:55" }
            ]
        }
    ],
    calls: [
        { contact: "Desconhecido", type: "missed", time: "23:56 PM", date: "11 de Setembro" },
        { contact: "Giselle (Mãe)", type: "missed", time: "23:42 PM", date: "10 de Setembro" },
        { contact: "Michel Newton", type: "answered", duration: "1m 45s", time: "22:05 PM", date: "10 de Setembro" },
        { contact: "Bianca Muller", type: "answered", duration: "12m 30s", time: "21:10 PM", date: "10 de Setembro" }
    ],
    gallery: [
        { id: "photo1", title: "Quadro de Fórmulas", label: "Fórmulas" },
        { id: "photo2", title: "Símbolo na Capa do Livro", label: "Capa do Livro" },
        { id: "photo3", title: "Estufa Noturna", label: "Estufa" }
    ],
    files: [
        {
            name: "OCORRENCIA_POLICIAL_AMEACAS.PDF",
            icon: "file-text",
            content: `<b>📁 OCORRENCIA_POLICIAL_AMEACAS.PDF</b><br>
<i>Data de Registro: 08/09/2023</i><br><br>
Ocorrência registrada por Daniela Alborghetti contra o ex-companheiro <b>Michel Newton</b> por assédio, perseguição e ameaças de agressão física após o término do namoro. Medida protetiva de urgência estava em andamento.`
        },
        {
            name: "RELATÓRIO_QUÍMICO_EVIDENCIA_ROSA.PDF",
            icon: "file-text",
            content: `<b>📁 RELATÓRIO_QUÍMICO_EVIDENCIA_ROSA.PDF</b><br>
<i>Emitido por Forense Botânica Geral</i><br><br>
- A flor depositada sobre o peito da vítima é uma rosa natural tingida de preto com tinta spray acrílica.<br>
- **ANÁLISE DE SOLO:** Traços do adubo patenteado <b>"Phos-Grow 4"</b> foram achados nas folhas. Este adubo foi proibido pelo IBAMA em 2022. A única estufa com estoque residual licenciado na cidade é a <b>Floricultura Flor de Newton</b>, pertencente à família do suspeito <b>Michel Newton</b>.`
        },
        {
            name: "IMAGENS_CAMERAS_SEGURANCA.TXT",
            icon: "file",
            content: `<b>📁 IMAGENS_CAMERAS_SEGURANCA.TXT</b><br>
<i>Extração de Câmeras do Hotel Palace e Adjacências</i><br><br>
As imagens das câmeras de segurança próximas ao Hotel Palace na noite de 10 de Setembro foram analisadas.<br><br>
<b>Descoberta:</b> Apesar de ter feito check-in junto com sua madrasta Giselle e alegado estar dormindo em seu quarto, as filmagens registram <b>Vitor</b> saindo às escondidas pelas portas dos fundos do hotel à 01:15 da manhã, vestindo um casaco de lã cinza escuro.<br><br>
<b>Veredito:</b> O álibi físico de Vitor de que permaneceu no hotel durante toda a noite é FALSO. Sua saída coincide com a janela temporal do crime.`
        }
    ]
};

const accusationAnswers = {
    killer: "suspect4", // Vitor
    motive: "inheritance", 
    method: "poison"  
};

const revelationData = {
    killerName: "Vitor",
    textSteps: [
      {
        title: "O Ressentimento e a Ameaça",
        content: "Vitor, irmão-postiço de Daniela, nutria um forte ressentimento contra ela. Ele descobriu que Daniela pretendia revelar antigos segredos familiares profundos — incluindo um relacionamento proibido dela com o padrasto na adolescência —, o que abalaria gravemente a reputação da família. Vitor decidiu confrontá-la naquela madrugada."
      },
      {
        title: "A Quebra do Álibi do Hotel",
        content: "Giselle e Vitor alegavam que estavam em seus respectivos quartos no Hotel Palace na noite do crime. Porém, as câmeras de segurança próximas ao hotel registraram Vitor saindo do local às escondidas pelas portas dos fundos durante a madrugada, quebrando completamente seu álibi."
      },
      {
        title: "O Confronto Violento",
        content: "Vitor foi até o apartamento de Daniela e iniciou uma discussão acalorada. Durante a briga corporal na cozinha, uma taça de vidro foi quebrada e caiu no chão. Em um momento de raiva e agressividade, Vitor pegou um dos fragmentos pontiagudos de vidro e desferiu um golpe fatal na garganta de Daniela."
      },
      {
        title: "A Encenação e a Rosa Negra",
        content: "Após matar Daniela, Vitor arrumou o corpo dela alinhado no chão da cozinha. Sabendo do interesse obsessivo de Daniela por crimes reais e pelo serial killer 'Príncipe Negro', ele comprou uma única rosa negra naquela madrugada e a colocou cuidadosamente sobre o peito dela, tentando encenar a cena para simular a assinatura do assassino em série e desviar as suspeitas de si."
      },
      {
        title: "As Pistas Forenses Fatais",
        content: "A investigação reuniu provas irrefutáveis contra Vitor: micro-fragmentos de fibras de tecido escuro de suas vestes sob as unhas de Daniela (fruto de sua reação de autodefesa física), o registro de sua compra de uma única rosa negra na floricultura naquela madrugada e as gravações das câmeras de segurança do hotel."
      },
      {
        title: "Justiça para Daniela",
        content: "Confrontado com o conjunto de evidências — as fibras sob as unhas, o registro da compra da rosa e os vídeos de segurança do hotel —, Vitor entrou em contradição e acabou confessando o crime. A farsa da rosa negra foi desfeita, revelando a tragédia de uma família desestruturada por segredos e ressentimentos."
      }
    ]
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    // Run cinematic boot sequence first, then init app
    runBootSequence(() => {
        initRouter();
        initAppEvents();
        initAmbientVisuals();
        renderSuspects();
        renderSuspectDropdown();
        lucide.createIcons();
        
        // Initial logs
        logSystemEvent("CONEXÃO SEGURA ESTABELECIDA. AGUARDANDO AUTENTICAÇÃO...", "success");
        logSystemEvent("DIRETÓRIO DA INVESTIGAÇÃO DE CRIME: #RN-09-ROSA");
    });
});

// --- Cinematic Boot Sequence ---
function runBootSequence(onComplete) {
    const bootLoader = document.getElementById("boot-loader");
    const progressBar = document.getElementById("boot-progress-bar");
    const logFeed = document.getElementById("boot-log-feed");
    
    const bootMessages = [
        { text: "> INICIANDO SISTEMA RIC v3.1.4...", type: "", delay: 200 },
        { text: "> VERIFICANDO INTEGRIDADE DO BANCO DE DADOS...", type: "", delay: 500 },
        { text: "> [OK] HASH MD5: 7F3A9B2C1D4E5F6A", type: "ok", delay: 800 },
        { text: "> CARREGANDO MÓDULOS FORENSES...", type: "", delay: 1100 },
        { text: "> [OK] THREE.JS ENGINE v128 — RENDERER ATIVO", type: "ok", delay: 1400 },
        { text: "> AUTENTICANDO CANAL SEGURO FID-SEC-09...", type: "", delay: 1700 },
        { text: "> [OK] TLS 1.3 — CRIPTOGRAFIA AES-256 ATIVADA", type: "ok", delay: 2000 },
        { text: "> CARREGANDO DOSSIÊ: FID-09-RN-LÍRIO...", type: "", delay: 2300 },
        { text: "> [AVISO] ACESSO RESTRITO — NÍVEL DELTA-CRIMSON", type: "warn", delay: 2600 },
        { text: "> [OK] PORTAL PRONTO. BEM-VINDO, INVESTIGADOR.", type: "ok", delay: 2900 }
    ];

    let progress = 0;
    const totalTime = 3200;
    
    // Animate progress bar
    const progressInterval = setInterval(() => {
        progress += 2;
        if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
        if (progress >= 100) clearInterval(progressInterval);
    }, totalTime / 50);
    
    // Add log messages with delay
    bootMessages.forEach(msg => {
        setTimeout(() => {
            if (!logFeed) return;
            const line = document.createElement("div");
            line.className = `boot-log-line ${msg.type}`;
            line.textContent = msg.text;
            logFeed.appendChild(line);
            // Keep only last 5 lines visible
            while (logFeed.children.length > 5) {
                logFeed.removeChild(logFeed.firstChild);
            }
        }, msg.delay);
    });
    
    // Dismiss boot screen
    setTimeout(() => {
        if (bootLoader) {
            bootLoader.classList.add("fade-out");
            setTimeout(() => {
                bootLoader.style.display = "none";
                onComplete();
            }, 600);
        } else {
            onComplete();
        }
    }, totalTime);
}


// --- Dynamic SPA Router ---
function initRouter() {
    const routeButtons = document.querySelectorAll(".btn-route");
    const backBtn = document.getElementById("btn-back");

    routeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetViewId = btn.getAttribute("data-target");
            navigateTo(targetViewId);
        });
    });

    backBtn.addEventListener("click", () => {
        navigateBack();
    });
}

function navigateTo(viewId) {
    if (viewId === state.activeView) return;

    // Save history
    state.viewHistory.push(state.activeView);
    
    // Switch views
    document.getElementById(state.activeView).classList.remove("active");
    document.getElementById(viewId).classList.add("active");
    state.activeView = viewId;

    updateHeaderControls();
    
    // Trigger special module loads
    if (viewId === "view-scene") {
        window.initScene3D && window.initScene3D();
    } else if (viewId === "view-autopsy") {
        window.initAutopsy3D && window.initAutopsy3D();
    } else if (viewId === "view-phone") {
        renderPhoneHome();
    } else if (viewId === "view-lab") {
        if (state.labUnlocked) {
            document.getElementById("lab-lock-screen").classList.add("hidden");
            document.getElementById("lab-main-content").classList.remove("hidden");
            renderLabQueue();
            window.startLabAnimations && window.startLabAnimations();
        } else {
            document.getElementById("lab-lock-screen").classList.remove("hidden");
            document.getElementById("lab-main-content").classList.add("hidden");
            document.getElementById("lab-lock-intro").classList.remove("hidden");
            document.getElementById("lab-lock-game-wrapper").classList.add("hidden");
            window.stopLabLockGame && window.stopLabLockGame();
        }
    } else if (viewId === "view-intro") {
        startIntroTypewriter();
    }

    if (viewId !== "view-lab" && window.stopLabAnimations) {
        window.stopLabAnimations();
        window.stopLabLockGame && window.stopLabLockGame();
    }
    
    // Smooth scroll top on view change
    document.querySelector(".viewport").scrollTop = 0;
}

function navigateBack() {
    if (state.viewHistory.length === 0) return;
    
    const previousViewId = state.viewHistory.pop();
    
    document.getElementById(state.activeView).classList.remove("active");
    document.getElementById(previousViewId).classList.add("active");
    
    // Cleanup if exiting special views
    if (state.activeView === "view-scene" && window.disposeScene3D) {
        window.disposeScene3D();
    }
    if (state.activeView === "view-autopsy" && window.disposeAutopsy3D) {
        window.disposeAutopsy3D();
    }
    if (state.activeView === "view-lab" && window.stopLabAnimations) {
        window.stopLabAnimations();
        window.stopLabLockGame && window.stopLabLockGame();
    }
    if (previousViewId === "view-lab") {
        if (state.labUnlocked) {
            document.getElementById("lab-lock-screen").classList.add("hidden");
            document.getElementById("lab-main-content").classList.remove("hidden");
            renderLabQueue();
            window.startLabAnimations && window.startLabAnimations();
        } else {
            document.getElementById("lab-lock-screen").classList.remove("hidden");
            document.getElementById("lab-main-content").classList.add("hidden");
            document.getElementById("lab-lock-intro").classList.remove("hidden");
            document.getElementById("lab-lock-game-wrapper").classList.add("hidden");
            window.stopLabLockGame && window.stopLabLockGame();
        }
    }
    
    state.activeView = previousViewId;
    updateHeaderControls();
}

function updateHeaderControls() {
    const header = document.getElementById("app-header");
    const backBtn = document.getElementById("btn-back");

    // Hide header on landing and login
    if (state.activeView === "view-landing" || state.activeView === "view-login") {
        header.classList.add("hidden");
    } else {
        header.classList.remove("hidden");
    }

    // Hide/show back button
    if (state.activeView === "view-portal" || state.viewHistory.length === 0) {
        backBtn.classList.add("hidden");
    } else {
        backBtn.classList.remove("hidden");
    }
}

// --- Console Logging Engine ---
function logSystemEvent(message, type = "info") {
    const feed = document.getElementById("terminal-log-feed");
    if (!feed) return;

    const entry = document.createElement("div");
    if (type === "success") entry.className = "log-entry log-success";
    else if (type === "alert") entry.className = "log-entry log-alert";
    else entry.className = "log-entry";

    const time = new Date();
    const timeStr = String(time.getHours()).padStart(2, '0') + ":" + 
                    String(time.getMinutes()).padStart(2, '0') + ":" + 
                    String(time.getSeconds()).padStart(2, '0');

    entry.innerHTML = `<span class="timestamp">[${timeStr}]</span> ${message}`;
    feed.appendChild(entry);
    
    // Auto scroll
    const consoleContainer = feed.parentElement;
    consoleContainer.scrollTop = consoleContainer.scrollHeight;
}
window.logSystemEvent = logSystemEvent;

// --- Ambient Background Graphics (Landing) ---
function initAmbientVisuals() {
    const canvas = document.getElementById("landing-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    window.addEventListener("resize", () => {
        if (!canvas) return;
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
    });

    let angle = 0;
    
    function draw() {
        ctx.fillStyle = "rgba(5, 5, 5, 0.08)";
        ctx.fillRect(0, 0, width, height);
        
        ctx.save();
        ctx.translate(width / 2, height / 2.5);
        ctx.rotate(angle);
        
        // Technical circular grids
        ctx.strokeStyle = "rgba(0, 240, 255, 0.03)";
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.arc(0, 0, 120, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(239, 68, 68, 0.06)";
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        ctx.beginPath();
        ctx.moveTo(-180, 0); ctx.lineTo(180, 0);
        ctx.moveTo(0, -180); ctx.lineTo(0, 180);
        ctx.stroke();

        ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            let rot = (Math.PI / 3) * i;
            let x = Math.cos(rot) * 100;
            let y = Math.sin(rot) * 100;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
        
        angle += 0.002;
        requestAnimationFrame(draw);
    }
    
    draw();
}

// --- Application Core Events ---
function initAppEvents() {
    // 1. Landing -> Login
    document.getElementById("btn-start").addEventListener("click", () => {
        navigateTo("view-login");
    });

    // 2. Login Form handler
    const loginForm = document.getElementById("form-login");
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameVal = document.getElementById("input-name").value.trim();
        
        state.investigatorName = nameVal || "Investigador";
        state.isAuthenticated = true;
        state.sessionStartTime = new Date();

        // UI Updates
        document.querySelectorAll(".display-agent").forEach(el => el.textContent = state.investigatorName);
        document.getElementById("display-investigator-name").textContent = state.investigatorName;
        
        // Start Session Timer
        startSessionTimer();

        // Alert Banner / Welcome
        showPushBanner(`Acesso Autorizado. Bem-vindo, Investigador ${state.investigatorName}.`);

        // Logs
        logSystemEvent(`CREDENCIAIS DE AGENTE CARREGADAS: '${state.investigatorName}'`);
        logSystemEvent("SESSÃO INICIADA. CANAIS OPERACIONAIS SINCRONIZADOS.", "success");

        navigateTo("view-intro");
    });

    // 2B. Depoimento Intro events
    const textTarget = document.getElementById("intro-narrative-text");
    if (textTarget) {
        textTarget.addEventListener("click", () => {
            skipIntroTypewriter();
        });
    }
    const introSkipBtn = document.getElementById("intro-skip-btn");
    if (introSkipBtn) {
        introSkipBtn.addEventListener("click", () => {
            skipIntroTypewriter();
        });
    }
    const introStartBtn = document.getElementById("intro-start-btn");
    if (introStartBtn) {
        introStartBtn.addEventListener("click", () => {
            const dramaticOverlay = document.getElementById("dramatic-entry-overlay");
            if (dramaticOverlay) {
                dramaticOverlay.classList.remove("hidden");
                dramaticOverlay.style.opacity = "1";
                
                const l1 = document.getElementById("de-line-1");
                const l2 = document.getElementById("de-line-2");
                const l3 = document.getElementById("de-line-3");
                
                if (l1) l1.style.opacity = "0";
                if (l2) l2.style.opacity = "0";
                if (l3) l3.style.opacity = "0";
                
                setTimeout(() => {
                    if (l1) l1.style.opacity = "1";
                    logSystemEvent("INTRUSÃO: SINCRO SISTEMAS IML ESTABELECIDA.");
                }, 300);
                
                setTimeout(() => {
                    if (l2) l2.style.opacity = "1";
                    logSystemEvent("INTRUSÃO: CONJUNTO DE DADOS OPERACIONAIS #RN-09 CARREGADO.");
                }, 900);
                
                setTimeout(() => {
                    if (l3) l3.style.opacity = "1";
                    logSystemEvent("INTRUSÃO: ACESSO DE INVESTIGAÇÃO ROSA NEGRA AUTORIZADO.", "success");
                }, 1500);
                
                setTimeout(() => {
                    dramaticOverlay.style.opacity = "0";
                }, 2200);
                
                setTimeout(() => {
                    dramaticOverlay.classList.add("hidden");
                    navigateTo("view-portal");
                }, 2700);
            } else {
                navigateTo("view-portal");
            }
        });
    }

    // 3. Header Panel Drawer toggle
    const btnMenu = document.getElementById("btn-menu");
    const menuDrawer = document.getElementById("menu-drawer");
    const btnCloseDrawer = document.getElementById("btn-close-drawer");

    btnMenu.addEventListener("click", () => {
        menuDrawer.classList.toggle("hidden");
    });

    btnCloseDrawer.addEventListener("click", () => {
        menuDrawer.classList.add("hidden");
    });

    // 4. Logout Handler
    document.getElementById("btn-logout").addEventListener("click", () => {
        state.isAuthenticated = false;
        state.investigatorName = "";
        clearInterval(state.sessionTimerId);
        menuDrawer.classList.add("hidden");
        state.viewHistory = [];
        
        // Clean logs
        document.getElementById("terminal-log-feed").innerHTML = "";
        logSystemEvent("CONEXÃO SEGURA ESTABELECIDA. AGUARDANDO AUTENTICAÇÃO...", "success");
        logSystemEvent("DIRETÓRIO DA INVESTIGAÇÃO DE CRIME: #RN-09-ROSA");

        navigateTo("view-landing");
    });

    // 5. 3D Detail Sheets Closing
    document.getElementById("btn-close-scene-sheet").addEventListener("click", () => {
        document.getElementById("scene-detail-panel").classList.remove("active");
    });
    
    document.getElementById("btn-close-autopsy-sheet").addEventListener("click", () => {
        document.getElementById("autopsy-detail-panel").classList.remove("active");
    });

    // 6. Crime Scene "Send to Lab" button
    document.getElementById("btn-send-to-lab").addEventListener("click", () => {
        if (state.selectedEvidenceId) {
            sendClueToLab(state.selectedEvidenceId);
            document.getElementById("scene-detail-panel").classList.remove("active");
        }
    });

    // 7. Suspect Modal Close
    document.getElementById("btn-close-suspect-modal").addEventListener("click", () => {
        document.getElementById("suspect-detail-modal").classList.add("hidden");
    });

    // 8. Victim Phone PIN entry
    const pinButtons = document.querySelectorAll(".pin-btn[data-val]");
    const pinClear = document.querySelector(".pin-clear");
    const pinSubmit = document.querySelector(".pin-submit");

    pinButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (state.currentPinAttempt.length < 4) {
                state.currentPinAttempt += btn.getAttribute("data-val");
                updatePinDots();
            }
        });
    });

    pinClear.addEventListener("click", () => {
        state.currentPinAttempt = "";
        updatePinDots();
        document.getElementById("phone-pin-error").classList.add("hidden");
    });

    pinSubmit.addEventListener("click", () => {
        validatePhonePin();
    });

    const btnStartLabLock = document.getElementById("btn-start-lab-lock");
    if (btnStartLabLock) {
        btnStartLabLock.addEventListener("click", () => {
            document.getElementById("lab-lock-intro").classList.add("hidden");
            document.getElementById("lab-lock-game-wrapper").classList.remove("hidden");
            window.initLabLockGame && window.initLabLockGame();
        });
    }

    // 9. Victim Phone Simulator Tabs
    const phoneTabs = document.querySelectorAll(".phone-tab");
    phoneTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            phoneTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            const targetPaneId = tab.getAttribute("data-tab");
            document.querySelectorAll(".phone-tab-pane").forEach(pane => {
                pane.classList.remove("active-pane");
            });
            document.getElementById(targetPaneId).classList.add("active-pane");
        });
    });

    // 10. Close Active Conversation overlay
    document.getElementById("btn-close-conversation").addEventListener("click", () => {
        document.getElementById("chat-conversation-view").classList.add("hidden");
    });

    // 11. Accusation Form Submission
    const formAccusation = document.getElementById("form-accusation");
    formAccusation.addEventListener("submit", (e) => {
        e.preventDefault();
        const culpritSelect = document.getElementById("select-culprit");
        const selectedSuspect = suspectsData.find(s => s.id === culpritSelect.value);

        if (selectedSuspect) {
            document.getElementById("result-culprit-name").textContent = selectedSuspect.name;
            const statusBadge = document.querySelector("#accusation-result-screen .badge");
            const resultHeader = document.querySelector("#accusation-result-screen h2");
            const restartBtn = document.getElementById("btn-restart-app");
            const successIcon = document.querySelector("#accusation-result-screen .success-icon");
            
            if (selectedSuspect.id === accusationAnswers.killer) {
                // Success: Vitor
                if (statusBadge) {
                    statusBadge.textContent = "SUCESSO // CULPADO CAPTURADO";
                    statusBadge.className = "badge badge-success";
                }
                if (resultHeader) {
                    resultHeader.textContent = "MANDADO CONCLUÍDO";
                    resultHeader.style.color = "var(--color-accent)";
                }
                if (successIcon) {
                    successIcon.setAttribute("data-lucide", "shield-check");
                    successIcon.style.color = "var(--color-accent)";
                }
                
                // Construct beautiful revelation story steps
                let revelationHtml = `
                    <div style="text-align: left; margin-top: 15px;">
                        <h4 style="font-family: var(--font-display); font-size: 11px; color: var(--color-cyan-glow); margin-bottom: 12px; letter-spacing: 1px;">SINOPSE DA SOLUÇÃO DO CASO</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                `;
                revelationData.textSteps.forEach((step, index) => {
                    revelationHtml += `
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px;">
                            <strong style="display: block; font-size: 11px; color: var(--color-ice-white); margin-bottom: 4px;">${index + 1}. ${step.title}</strong>
                            <p style="font-size: 11px; color: var(--color-gray-subtle); line-height: 1.4; margin: 0;">${step.content}</p>
                        </div>
                    `;
                });
                revelationHtml += `</div></div>`;
                
                document.getElementById("result-justification-text").innerHTML = revelationHtml;
                document.getElementById("result-code").textContent = `RN-SUCCESS-2023-X`;
                
                if (restartBtn) {
                    restartBtn.textContent = "Reiniciar Investigação (Novo Jogo)";
                    restartBtn.setAttribute("data-action", "restart");
                }
                
                logSystemEvent(`MANDADO DE PRISÃO CONCLUÍDO CONTRA ${selectedSuspect.name.toUpperCase()}`, "success");
                logSystemEvent("INQUÉRITO ARQUIVADO: CULPADO CAPTURADO.", "success");
                updateInvestigationProgress(100);
            } else {
                // Failure: any other suspect
                if (statusBadge) {
                    statusBadge.textContent = "INSUFICIENTE // SUSPEITO POSSUI ÁLIBI";
                    statusBadge.className = "badge badge-danger";
                }
                if (resultHeader) {
                    resultHeader.textContent = "MANDADO NEGADO";
                    resultHeader.style.color = "#ef4444";
                }
                if (successIcon) {
                    successIcon.setAttribute("data-lucide", "shield-alert");
                    successIcon.style.color = "#ef4444";
                }
                
                let failureExplanation = "";
                if (selectedSuspect.id === "suspect1") {
                    failureExplanation = "Juliana tinha discussões acadêmicas sobre notas e trabalhos de faculdade, mas não possuía nenhum motivo financeiro ou familiar. Além disso, as fibras de roupa encontradas sob as unhas de Daniela indicam uma luta corporal com outra vestimenta.";
                } else if (selectedSuspect.id === "suspect2") {
                    failureExplanation = "Bianca Müller é a melhor amiga da vítima. Foi ela quem alertou Daniela sobre as ameaças anônimas e tentou protegê-la. O perfil de DNA coletado no fragmento de vidro da taça não condiz com Bianca.";
                } else if (selectedSuspect.id === "suspect3") {
                    failureExplanation = "Giselle, mãe da vítima, estava hospedada no Hotel Palace. O check-in confirma sua entrada às 21:00 e as gravações das câmeras de segurança do hotel atestam que ela permaneceu em seu quarto durante toda a madrugada.";
                } else if (selectedSuspect.id === "suspect5") {
                    failureExplanation = "Ingrid chegou em casa por volta das 02:00 e imediatamente ligou para o 190 ao encontrar o corpo na cozinha. Suas digitais não combinam com a taça de vidro e o álibi de seu jantar com amigos foi confirmado por testemunhas.";
                } else if (selectedSuspect.id === "suspect6") {
                    failureExplanation = "Embora Michel Newton possuísse histórico de agressividade e tenha ido até o portão de Daniela enviar ameaças, ela não abriu a porta para ele (como indicado em suas últimas mensagens). Michel permaneceu do lado de fora e depois foi visto no Bar de Bilhar.";
                }
                
                let revelationHtml = `
                    <div style="text-align: left; margin-top: 15px;">
                        <h4 style="font-family: var(--font-display); font-size: 11px; color: #ef4444; margin-bottom: 12px; letter-spacing: 1px;">ÁLIBI DETECTADO // INDICIADO INCOMPATÍVEL</h4>
                        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 16px; border-radius: 6px; color: #ccc; font-size: 11px; line-height: 1.6; margin-bottom: 12px;">
                            ${failureExplanation}
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px;">
                            <strong style="display: block; font-size: 11px; color: var(--color-ice-white); margin-bottom: 4px;">🔍 Dica de Investigador:</strong>
                            <p style="font-size: 11px; color: var(--color-gray-subtle); line-height: 1.4; margin: 0;">Foque em descobrir quem quebrou o álibi do hotel, verifique o DNA no fragmento de vidro da taça, e compare o adubo da rosa negra com a estufa de flores!</p>
                        </div>
                    </div>
                `;
                
                document.getElementById("result-justification-text").innerHTML = revelationHtml;
                document.getElementById("result-code").textContent = `RN-FAILURE-${selectedSuspect.id.toUpperCase()}-ERR`;
                
                if (restartBtn) {
                    restartBtn.textContent = "Reabrir Inquérito (Tentar Novamente)";
                    restartBtn.setAttribute("data-action", "close_modal");
                }
                
                logSystemEvent(`MANDADO DE PRISÃO NEGADO CONTRA ${selectedSuspect.name.toUpperCase()} (ÁLIBI CONFIRMADO)`, "alert");
            }
            
            lucide.createIcons();
            document.getElementById("accusation-result-screen").classList.remove("hidden");
        }
    });

    // 12. Restart App Button
    document.getElementById("btn-restart-app").addEventListener("click", () => {
        const action = document.getElementById("btn-restart-app").getAttribute("data-action");
        if (action === "close_modal") {
            document.getElementById("accusation-result-screen").classList.add("hidden");
            return;
        }
        
        document.getElementById("accusation-result-screen").classList.add("hidden");
        document.getElementById("form-accusation").reset();
        
        // Reset state variables
        state.collectedEvidences = new Set(["rosa_negra", "taca_quebrada", "celular_vitima"]);
        state.sentToLab = {
            "rosa_negra": { status: "pending", progress: 0 },
            "taca_quebrada": { status: "pending", progress: 0 },
            "celular_vitima": { status: "pending", progress: 0 }
        };
        state.phoneUnlocked = false;
        state.progressPercent = 20;
        state.currentPinAttempt = "";
        
        // Reset components
        document.getElementById("phone-homescreen").classList.add("hidden");
        document.getElementById("phone-lockscreen").classList.remove("hidden");
        document.getElementById("phone-lockscreen").classList.add("active-screen");
        updatePinDots();
        renderLabQueue();
        updateInvestigationProgress(20);
        
        // Logs reset
        document.getElementById("terminal-log-feed").innerHTML = "";
        logSystemEvent("REINICIALIZAÇÃO DO BANCO DE DADOS EXECUTADO. SISTEMA RECONFIGURADO.", "alert");
        logSystemEvent("CONEXÃO SEGURA ESTABELECIDA. AGUARDANDO AUTENTICAÇÃO...", "success");
        logSystemEvent("DIRETÓRIO DA INVESTIGAÇÃO DE CRIME: #RN-09-ROSA");

        navigateTo("view-portal");
    });
}

// --- Session Timer ---
function startSessionTimer() {
    if (state.sessionTimerId) clearInterval(state.sessionTimerId);
    
    const timerLabel = document.getElementById("session-timer");
    const headerTimer = document.getElementById("header-timer");
    
    state.sessionTimerId = setInterval(() => {
        const elapsedMs = new Date() - state.sessionStartTime;
        const totalSecs = Math.floor(elapsedMs / 1000);
        
        const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        
        const timeStr = `${hrs}:${mins}:${secs}`;
        if (timerLabel) {
            timerLabel.textContent = timeStr;
        }
        if (headerTimer) {
            headerTimer.textContent = timeStr;
        }
        
        document.querySelectorAll(".current-time").forEach(el => {
            el.textContent = `${hrs}:${mins}`;
        });
    }, 1000);
}

// --- Push Notifications ---
function showPushBanner(message) {
    const banner = document.getElementById("alert-banner");
    const msgLabel = document.getElementById("alert-message");
    
    msgLabel.textContent = message;
    banner.classList.remove("hidden");
    
    setTimeout(() => {
        banner.classList.add("hidden");
    }, 4500);
}

// --- Dynamic Layout Renderers ---
function renderSuspects() {
    const container = document.getElementById("suspects-container");
    container.innerHTML = "";
    
    suspectsData.forEach(suspect => {
        const card = document.createElement("div");
        card.className = "suspect-card";
        card.addEventListener("click", () => {
            openSuspectDossier(suspect);
        });

        // Use real image Polaroid style
        card.innerHTML = `
            <div class="suspect-thumbnail">
                <img src="${suspect.photo}" alt="${suspect.name}" style="width:100%; height:100%; object-fit:cover; filter: grayscale(1); border-radius:4px;">
                <span class="classified-stamp">SUSPEITO</span>
            </div>
            <div class="suspect-brief">
                <h3>${suspect.name}</h3>
                <p>Ocupação: ${suspect.occupation}</p>
                <p>Vínculo: ${suspect.relationship}</p>
            </div>
            <i data-lucide="chevron-right"></i>
        `;
        container.appendChild(card);
    });
}

function openSuspectDossier(suspect) {
    const modal = document.getElementById("suspect-detail-modal");
    const content = document.getElementById("suspect-modal-content");
    
    // Logs
    logSystemEvent(`ACESSO AUTORIZADO AO DOSSIÊ: ${suspect.dossierCode}`);

    const isPrimaryNote = suspect.notes.includes("Suspeito principal");

    content.innerHTML = `
        <div class="dossier-profile">
            <div class="dossier-photo" style="position:relative; overflow:hidden;">
                <img src="${suspect.photo}" alt="${suspect.name}" style="width:100%; height:100%; object-fit:cover; filter: grayscale(0.8) contrast(1.1);">
                <div style="position:absolute; inset:0; background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px); pointer-events:none;"></div>
                <div style="position:absolute; bottom:0; left:0; right:0; background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%); padding:8px; font-family:var(--font-display); font-size:8px; letter-spacing:1px; color:rgba(255,255,255,0.6);">${suspect.dossierCode}</div>
            </div>
            <div class="dossier-summary">
                <h2>${suspect.name}</h2>
                <div class="info-row">Cód: <strong>${suspect.dossierCode}</strong></div>
                <div class="info-row">Idade: <strong>${suspect.age} anos</strong></div>
                <div class="info-row">Função: <strong>${suspect.occupation}</strong></div>
                <div class="info-row">Vínculo: <strong>${suspect.relationship}</strong></div>
                ${isPrimaryNote ? `<span class="badge badge-danger" style="margin-top:8px; display:inline-flex; align-items:center; gap:4px;"><i data-lucide="alert-triangle" style="width:10px;height:10px;"></i> SUSPEITO PRINCIPAL</span>` : ''}
            </div>
        </div>
        
        <div class="dossier-section">
            <h3>ÁLIBI FORNECIDO</h3>
            <p>${suspect.alibi}</p>
        </div>
        
        <div class="dossier-section">
            <h3>HISTÓRICO CRIMINAL / INVESTIGAÇÃO</h3>
            <p>${suspect.history}</p>
        </div>
        
        <div class="dossier-section">
            <h3>DEPOIMENTO DE CAMPO</h3>
            <p class="testimonial" style="border-left: 2px solid rgba(0,240,255,0.3); padding-left: 12px; font-style: italic;">${suspect.testimony}</p>
        </div>

        <div class="dossier-section" style="border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; background: rgba(255,255,255,0.01);">
            <h3>OBSERVAÇÕES DO LABORATÓRIO</h3>
            <p style="color: ${isPrimaryNote ? 'rgba(239,68,68,0.9)' : 'var(--color-gray-subtle)'};">${suspect.notes}</p>
        </div>
    `;

    modal.classList.remove("hidden");
    lucide.createIcons();
}

function renderSuspectDropdown() {
    const select = document.getElementById("select-culprit");
    select.innerHTML = `<option value="" disabled selected>Escolha um suspeito...</option>`;
    
    suspectsData.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

function updatePinDots() {
    const dots = document.querySelectorAll(".pin-dots .dot");
    dots.forEach((dot, index) => {
        if (index < state.currentPinAttempt.length) {
            dot.classList.add("filled");
        } else {
            dot.classList.remove("filled");
        }
    });
}

function validatePhonePin() {
    if (state.phonePinAttemptsLeft <= 0) return;

    if (state.currentPinAttempt === state.phonePinCode) {
        state.phoneUnlocked = true;
        document.getElementById("phone-pin-error").classList.add("hidden");
        document.getElementById("phone-lockscreen").classList.remove("active-screen");
        document.getElementById("phone-lockscreen").classList.add("hidden");
        document.getElementById("phone-homescreen").classList.remove("hidden");
        
        // Progress upgrade
        updateInvestigationProgress(65);
        showPushBanner("DISPOSITIVO CELULAR DESBLOQUEADO COM SUCESSO.");
        
        // Logs
        logSystemEvent("CELULAR DA VÍTIMA: DESCRIPTOGRAFIA COMPLETA", "success");

        renderPhoneHome();
    } else {
        const pinTried = state.currentPinAttempt;
        state.currentPinAttempt = "";
        updatePinDots();
        
        state.phonePinAttemptsLeft--;
        
        const attemptsText = document.getElementById("phone-pin-attempts");
        if (attemptsText) {
            attemptsText.textContent = `Tentativas restantes: ${state.phonePinAttemptsLeft}`;
            if (state.phonePinAttemptsLeft <= 2) {
                attemptsText.classList.add("warning");
            } else {
                attemptsText.classList.remove("warning");
            }
        }

        const errText = document.getElementById("phone-pin-error");
        
        if (state.phonePinAttemptsLeft <= 0) {
            errText.classList.add("hidden");
            document.getElementById("phone-lockout-screen").classList.remove("hidden");
            logSystemEvent("FALHA DE INTRUSÃO: CHIP DE SEGURANÇA BLOQUEOU O TERMINAL.", "danger");
            return;
        }
        
        errText.classList.remove("hidden");
        
        // Logs
        logSystemEvent(`FALHA NA DESCRIPTOGRAFIA DO DISPOSITIVO CELULAR: PIN INCORRETO ('${pinTried}'). RESTAM ${state.phonePinAttemptsLeft} TENTATIVAS.`, "alert");

        errText.style.animation = 'none';
        errText.offsetHeight;
        errText.style.animation = null;
    }
}

function renderPhoneHome() {
    const lockScreen = document.getElementById("phone-lockscreen");
    const homeScreen = document.getElementById("phone-homescreen");
    
    if (state.phoneUnlocked) {
        if (lockScreen) {
            lockScreen.classList.remove("active-screen");
            lockScreen.classList.add("hidden");
        }
        if (homeScreen) {
            homeScreen.classList.remove("hidden");
        }
    } else {
        if (lockScreen) {
            lockScreen.classList.add("active-screen");
            lockScreen.classList.remove("hidden");
        }
        if (homeScreen) {
            homeScreen.classList.add("hidden");
        }
        return;
    }
    
    // 1. Render chats
    const chatList = document.querySelector(".chat-list");
    chatList.innerHTML = "";
    
    victimPhoneData.chats.forEach(chat => {
        const item = document.createElement("div");
        item.className = "chat-item";
        item.addEventListener("click", () => openChatConversation(chat));
        
        let avatarHTML = "";
        const suspect = suspectsData.find(s => s.id === chat.id);
        if (suspect && suspect.photo) {
            avatarHTML = `<img src="${suspect.photo}" alt="${chat.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatarHTML = `<i data-lucide="user" style="width: 16px; height: 16px; color: var(--color-gray-subtle);"></i>`;
        }
        
        item.innerHTML = `
            <div class="chat-avatar">${avatarHTML}</div>
            <div class="chat-info">
                <div class="chat-name-row">
                    <span class="chat-contact-name">${chat.name}</span>
                    <span class="chat-timestamp">${chat.time}</span>
                </div>
                <div class="chat-last-msg">${chat.lastMsg}</div>
            </div>
            ${chat.unread ? '<span class="chat-badge"></span>' : ''}
        `;
        chatList.appendChild(item);
    });

    // 2. Render Call logs
    const callListContainer = document.getElementById("phone-calls-list");
    callListContainer.innerHTML = "";
    victimPhoneData.calls.forEach(call => {
        const item = document.createElement("div");
        item.className = "call-item";
        
        const iconType = call.type === "missed" ? "phone-missed" : "phone-incoming";
        const iconClass = call.type === "missed" ? "missed" : "answered";
        
        item.innerHTML = `
            <div class="call-details">
                <i data-lucide="${iconType}" class="${iconClass}"></i>
                <div class="call-contact">
                    <span>${call.contact}</span>
                    <span>${call.type === "missed" ? "Chamada não atendida" : `Duração: ${call.duration}`}</span>
                </div>
            </div>
            <div class="call-time">
                <span>${call.time}</span>
            </div>
        `;
        callListContainer.appendChild(item);
    });

    // 3. Render Gallery
    const galleryGrid = document.getElementById("phone-gallery-list");
    if (galleryGrid) {
        galleryGrid.innerHTML = "";
        victimPhoneData.gallery.forEach(photo => {
            const item = document.createElement("div");
            item.className = "gallery-photo-card";
            item.addEventListener("click", () => viewGalleryImage(photo));

            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 100;
            item.appendChild(canvas);
            
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0,0,100,100);
            
            ctx.strokeStyle = "rgba(255,255,255,0.15)";
            ctx.lineWidth = 1;
            if(photo.id === "photo1") {
                ctx.strokeRect(10, 10, 80, 80);
                ctx.fillStyle = "rgba(0, 240, 255, 0.2)";
                ctx.font = "8px Courier";
                ctx.fillText("H2O + C18H21NO3", 14, 50);
            } else if (photo.id === "photo2") {
                ctx.beginPath();
                ctx.arc(50, 50, 25, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
                ctx.font = "14px Courier";
                ctx.fillText("✖", 42, 55);
            } else {
                ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
                ctx.beginPath();
                ctx.moveTo(10, 90); ctx.lineTo(40, 40); ctx.lineTo(70, 90);
                ctx.fill();
            }

            const overlayText = document.createElement("span");
            overlayText.style.position = "absolute";
            overlayText.style.bottom = "2px";
            overlayText.style.left = "4px";
            overlayText.style.fontSize = "8px";
            overlayText.style.color = "#94a3b8";
            overlayText.textContent = photo.label;
            item.appendChild(overlayText);

            galleryGrid.appendChild(item);
        });
    }

    // 4. Render Decrypted Files
    const filesListContainer = document.getElementById("phone-files-list");
    if (filesListContainer) {
        filesListContainer.innerHTML = "";
        victimPhoneData.files.forEach(file => {
            const item = document.createElement("div");
            item.className = "phone-file-item";
            item.addEventListener("click", () => {
                showPushBanner(`ARQUIVO ABERTO: ${file.name}`);
                openFileViewer(file);
            });
            
            item.innerHTML = `
                <div class="file-header">
                    <i data-lucide="${file.icon}"></i>
                    <span>${file.name}</span>
                </div>
                <div class="file-content-preview">
                    ${file.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </div>
            `;
            filesListContainer.appendChild(item);
        });
    }

    lucide.createIcons();
}

function openChatConversation(chat) {
    chat.unread = false;
    renderPhoneHome();
    
    document.getElementById("conversation-partner-name").textContent = chat.name;
    const partnerAvatar = document.getElementById("conversation-partner-avatar");
    if (partnerAvatar) {
        const suspect = suspectsData.find(s => s.id === chat.id);
        if (suspect && suspect.photo) {
            partnerAvatar.innerHTML = `<img src="${suspect.photo}" alt="${chat.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            partnerAvatar.innerHTML = `<i data-lucide="user" style="width: 12px; height: 12px; color: var(--color-gray-subtle);"></i>`;
        }
    }
    
    const messagesList = document.getElementById("conversation-messages-list");
    messagesList.innerHTML = "";
    
    chat.messages.forEach(msg => {
        if (msg.isHeader) {
            const systemDiv = document.createElement("div");
            systemDiv.className = "chat-date-divider";
            systemDiv.style.textAlign = "center";
            systemDiv.style.margin = "14px 0";
            systemDiv.style.fontSize = "10px";
            systemDiv.style.color = "var(--color-gray-subtle)";
            systemDiv.style.fontFamily = "var(--font-mono)";
            systemDiv.style.letterSpacing = "1px";
            systemDiv.innerHTML = `<span style="background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border-color); text-transform: uppercase;">${msg.text}</span>`;
            messagesList.appendChild(systemDiv);
        } else {
            const bubble = document.createElement("div");
            bubble.className = `msg-bubble ${msg.sender}`;
            bubble.innerHTML = `
                ${msg.text}
                <span class="msg-timestamp">${msg.time}</span>
            `;
            messagesList.appendChild(bubble);
        }
    });

    document.getElementById("chat-conversation-view").classList.remove("hidden");
    messagesList.scrollTop = messagesList.scrollHeight;
    lucide.createIcons();
}

function viewGalleryImage(photo) {
    showPushBanner(`VISUALIZANDO ANEXO: ${photo.title}`);
}

function openFileViewer(file) {
    const modal = document.getElementById("suspect-detail-modal");
    const content = document.getElementById("suspect-modal-content");
    
    content.innerHTML = `
        <div class="dossier-section" style="margin-top: 10px;">
            <h3>ARQUIVO EXTRAÍDO DO SMARTPHONE // DESCRIPTOGRAFADO</h3>
            <p style="font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 6px; border: 1px solid var(--border-color); color: #ccc; line-height: 1.6;">
                ${file.content}
            </p>
        </div>
    `;
    
    modal.classList.remove("hidden");
    logSystemEvent(`ACESSO EXTRATADO AO ARQUIVO: ${file.name}`);
}

// --- Laboratory Forensics Engine ---
function startForensicTest(evidenceId) {
    if (!state.sentToLab[evidenceId] || state.sentToLab[evidenceId].status !== "pending") return;
    
    state.sentToLab[evidenceId].status = "analyzing";
    state.sentToLab[evidenceId].progress = 0;
    
    renderLabQueue();
    document.getElementById("lab-pending-badge").classList.remove("hidden");
    
    logSystemEvent(`LAB: INICIANDO ANÁLISE PARA ${evidenceId.toUpperCase()}`);
    if (evidenceId === "rosa_negra") {
        logSystemEvent("LAB: EXECUTANDO ESPECTROMETRIA DE MASSAS HPLC...");
    } else if (evidenceId === "taca_quebrada") {
        logSystemEvent("LAB: EXECUTANDO ELETROFORESE DE GEL DE DNA...");
    } else {
        logSystemEvent("LAB: INICIANDO BYPASS DE MEMÓRIA CELULAR...");
    }
    
    let progressInterval = setInterval(() => {
        if (!state.sentToLab[evidenceId] || state.sentToLab[evidenceId].status !== "analyzing") {
            clearInterval(progressInterval);
            return;
        }
        
        state.sentToLab[evidenceId].progress += 20;
        
        const fillBar = document.querySelector(`#lab-bar-${evidenceId}`);
        if (fillBar) {
            fillBar.style.width = `${state.sentToLab[evidenceId].progress}%`;
        }
        
        if (state.sentToLab[evidenceId].progress >= 100) {
            clearInterval(progressInterval);
            state.sentToLab[evidenceId].status = "completed";
            state.sentToLab[evidenceId].progress = 100;
            
            const pending = Object.values(state.sentToLab).some(item => item.status === "analyzing");
            if (!pending) {
                document.getElementById("lab-pending-badge").classList.add("hidden");
            }
            
            showPushBanner(`Análise da evidência '${evidenceData[evidenceId].title}' concluída!`);
            logSystemEvent(`LAB: ANÁLISE DE ${evidenceId.toUpperCase()} CONCLUÍDA COM SUCESSO.`, "success");
            
            updateInvestigationProgress(state.progressPercent + 15);
            renderLabQueue();
            
            // Re-trigger lab animations so the completed visualizer starts drawing
            if (window.startLabAnimations) {
                window.startLabAnimations();
            }
        }
    }, 1000); // 5 seconds total (20% per second)
}

function sendClueToLab(evidenceId) {
    startForensicTest(evidenceId);
}

function renderLabQueue() {
    const container = document.getElementById("lab-items-container");
    container.innerHTML = "";
    
    const sentList = Object.keys(state.sentToLab);
    
    if (sentList.length === 0) {
        container.innerHTML = `
            <div class="empty-lab-state">
                <i data-lucide="beaker" class="lab-pulse-icon"></i>
                <p>Nenhuma evidência enviada.</p>
                <p class="sub">Explore a <strong>Cena do Crime 3D</strong> para coletar amostras relevantes para o caso.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    sentList.forEach(id => {
        const itemInfo = evidenceData[id];
        const process = state.sentToLab[id];
        
        const card = document.createElement("div");
        card.className = "lab-card";
        
        let statusBadge = "";
        let actionBtn = "";
        
        if (process.status === "completed") {
            statusBadge = `<span class="badge badge-success">CONCLUÍDO</span>`;
        } else if (process.status === "analyzing") {
            statusBadge = `<span class="badge badge-accent">ANALISANDO...</span>`;
        } else {
            statusBadge = `<span class="badge badge-secondary">AGUARDANDO TESTE</span>`;
            actionBtn = `
                <div style="margin-top: 12px;">
                    <button class="btn btn-primary btn-full btn-glow run-test-btn" data-id="${id}">
                        <i data-lucide="beaker"></i> INICIAR TESTE FORENSE
                    </button>
                </div>
            `;
        }
            
        card.innerHTML = `
            <div class="lab-card-header">
                <span class="lab-card-title">${itemInfo.title}</span>
                ${statusBadge}
            </div>
            
            <div class="lab-progress-bar">
                <div id="lab-bar-${id}" class="lab-progress-bar-fill ${process.status === 'completed' ? 'finished' : ''}" style="width: ${process.progress}%"></div>
            </div>
            
            ${actionBtn}
            
            ${process.status === 'completed' ? `
                <div class="lab-details-reveal">
                    <canvas id="lab-canvas-${id}" width="340" height="130" class="lab-forensic-canvas"></canvas>
                    <div class="analysis-results-grid" style="margin-top: 12px;">
                        ${Object.entries(itemInfo.analysisDetails).map(([key, val]) => `
                            <div class="result-row">
                                <strong>${key}:</strong>
                                <span>${val}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            ` : ''}
        `;
        
        container.appendChild(card);
    });

    // Bind click events to forensic test buttons
    container.querySelectorAll(".run-test-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            startForensicTest(id);
        });
    });
    
    lucide.createIcons();
}

// --- Mass Spectrometry, DNA Electrophoresis, and Hex Decrypter Canvas Animator ---
let labAnimationId = null;

function startLabAnimations() {
    stopLabAnimations();
    
    const sentList = Object.keys(state.sentToLab);
    const completedList = sentList.filter(id => state.sentToLab[id].status === "completed");
    
    if (completedList.length === 0) return;
    
    const startTime = performance.now();
    
    function tick(time) {
        const elapsed = (time - startTime) * 0.001;
        
        completedList.forEach(id => {
            const canvas = document.getElementById(`lab-canvas-${id}`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            drawForensicVisuals(id, ctx, canvas.width, canvas.height, elapsed);
        });
        
        labAnimationId = requestAnimationFrame(tick);
    }
    
    labAnimationId = requestAnimationFrame(tick);
}

function stopLabAnimations() {
    if (labAnimationId) {
        cancelAnimationFrame(labAnimationId);
        labAnimationId = null;
    }
}

function drawForensicVisuals(id, ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    
    // Background style — dark retro grids
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, w, h);
    
    // Draw subtle grid lines
    ctx.strokeStyle = "rgba(16, 185, 129, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    
    if (id === "rosa_negra") {
        // --- MASS SPECTROMETRY WAVE ---
        ctx.strokeStyle = "#10b981"; // Emerald
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < w; x++) {
            let baseVal = h * 0.75;
            let peak1 = Math.exp(-Math.pow((x - w * 0.3) / 10, 2)) * h * 0.5;
            let peak2 = Math.exp(-Math.pow((x - w * 0.6) / 8, 2)) * h * 0.65;
            let peak3 = Math.exp(-Math.pow((x - w * 0.85) / 15, 2)) * h * 0.4;
            let noise = Math.sin(x * 0.5 + t * 10) * 1.5;
            
            let y = baseVal - peak1 - peak2 - peak3 + noise;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.fillStyle = "#ef4444"; // Red for toxic compound
        ctx.font = "bold 9px monospace";
        ctx.fillText("PHOS-GROW 4 [FIRT-4]", w * 0.52, h * 0.22);
        
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.6, h * 0.25);
        ctx.lineTo(w * 0.6, h * 0.15);
        ctx.stroke();
        
        // Draw rotating chemical ring
        ctx.save();
        ctx.translate(w * 0.15, h * 0.45);
        ctx.rotate(t * 0.5);
        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            let angle = (i * Math.PI) / 3;
            let rx = Math.cos(angle) * 20;
            let ry = Math.sin(angle) * 20;
            if (i === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        for (let i = 0; i < 6; i += 2) {
            let angleStart = (i * Math.PI) / 3 + 0.1;
            let angleEnd = ((i + 1) * Math.PI) / 3 - 0.1;
            ctx.moveTo(Math.cos(angleStart) * 15, Math.sin(angleStart) * 15);
            ctx.lineTo(Math.cos(angleEnd) * 15, Math.sin(angleEnd) * 15);
        }
        ctx.stroke();
        
        ctx.restore();
        
        ctx.fillStyle = "rgba(16, 185, 129, 0.7)";
        ctx.font = "8px monospace";
        ctx.fillText("HPLC SPECTROMETRY LOG // SAMPLE RN-9", 10, h - 10);
        
    } else if (id === "taca_quebrada") {
        // --- DNA ELECTROPHORESIS ---
        let colWidth = w / 4;
        let labels = ["VÍTIMA", "AMOSTRA", "M. NEWTON", "CONTROLE"];
        
        for (let i = 0; i < 4; i++) {
            let cx = colWidth * i + 10;
            
            ctx.fillStyle = i === 1 ? "#38bdf8" : "rgba(255,255,255,0.4)";
            ctx.font = "8px monospace";
            ctx.fillText(labels[i], cx, 15);
            
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.strokeRect(cx, 22, colWidth - 20, h - 45);
            
            ctx.fillStyle = i === 0 || i === 1 ? "rgba(56, 189, 248, 0.8)" : "rgba(16, 185, 129, 0.4)";
            if (i === 2) ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
            
            let bandPositions = [35, 50, 70, 95, 110];
            bandPositions.forEach((pos, idx) => {
                if (i === 0 || i === 1) {
                    ctx.fillRect(cx + 2, pos, colWidth - 24, 4);
                } else if (i === 2) {
                    if (idx % 2 === 0) {
                        ctx.fillRect(cx + 2, pos + Math.sin(t * 3) * 1, colWidth - 24, 4);
                    }
                } else {
                    if (idx % 3 === 0) {
                        ctx.fillRect(cx + 2, pos - 5, colWidth - 24, 4);
                    }
                }
            });
        }
        
        ctx.fillStyle = t % 1 < 0.5 ? "#38bdf8" : "rgba(56,189,248,0.5)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("DNA MATCH: 99.98% // SANGUE VÍTIMA", w * 0.42, h - 8);
        
    } else if (id === "celular_vitima") {
        // --- DECRYPTION GRID / HEX LOG ---
        ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
        ctx.font = "9px monospace";
        
        let rowCount = 6;
        for (let r = 0; r < rowCount; r++) {
            let hexStr = "";
            let seed = Math.floor(t * 4) + r;
            for (let c = 0; c < 6; c++) {
                let val = Math.floor(Math.abs(Math.sin(seed * 73 + c * 37) * 256)).toString(16).toUpperCase().padStart(2, "0");
                hexStr += val + " ";
            }
            let asciiStr = "";
            for (let c = 0; c < 5; c++) {
                asciiStr += String.fromCharCode(33 + (seed + c) % 90);
            }
            
            ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
            ctx.fillText(`0x${(r * 16).toString(16).toUpperCase().padStart(4, "0")}:`, 10, 25 + r * 15);
            ctx.fillStyle = "#10b981";
            ctx.fillText(hexStr, 60, 25 + r * 15);
            ctx.fillStyle = "#38bdf8";
            ctx.fillText(asciiStr, 240, 25 + r * 15);
        }
        
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.strokeRect(10, h - 22, w - 20, 8);
        
        let barFill = Math.min(1.0, (t * 0.1) % 1.1) * (w - 24);
        ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
        ctx.fillRect(12, h - 20, barFill, 4);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "7px monospace";
        ctx.fillText("CORE SYNCING SECURE CHATS AND CALL LOGS...", 12, h - 25);
    }
}

// --- Investigation Progress State Changer ---
function updateInvestigationProgress(targetPercent) {
    state.progressPercent = Math.min(100, targetPercent);
    
    const fillEl = document.getElementById("portal-progress");
    const textEl = document.getElementById("portal-progress-text");
    
    if (fillEl && textEl) {
        fillEl.style.width = `${state.progressPercent}%`;
        textEl.textContent = `${state.progressPercent}%`;
    }

    const objectiveEl = document.getElementById("current-objective");
    if (objectiveEl) {
        if (state.progressPercent <= 25) {
            objectiveEl.textContent = "Examinar a cena do crime 3D em busca de pistas físicas para enviar ao laboratório.";
        } else if (state.progressPercent <= 50) {
            objectiveEl.textContent = "Aguardar conclusões das amostras no Laboratório e investigar o celular recuperado.";
        } else if (state.progressPercent <= 80) {
            objectiveEl.textContent = "Decifrar o celular usando a senha lógica e cruzar as digitais e ligações telefônicas da vítima.";
        } else {
            objectiveEl.textContent = "Dossiê completo. Acesse o módulo de Acusação Final para fechar o inquérito policial.";
        }
    }
}

// Expose state and details for ThreeJS interaction and animations
window.appState = state;
window.evidenceData = evidenceData;
window.autopsyData = autopsyData;
window.sendClueToLab = sendClueToLab;
window.startForensicTest = startForensicTest;
window.showPushBanner = showPushBanner;
window.startLabAnimations = startLabAnimations;
window.stopLabAnimations = stopLabAnimations;

// --- Deposition Intro Typewriter Effect ---
const introNarrativeText = 
    `Fui acionado às 03h27 da madrugada do dia 11 de setembro de 2023 para atender uma ocorrência de possível homicídio em um apartamento localizado no Cidade Jardim.\n\n` +
    `Ao chegar ao local com a equipe pericial, encontramos a vítima, Daniela Alborghetti, de 23 anos, caída no chão da cozinha. O corpo encontrava-se em posição incomum, cuidadosamente alinhado ao chão, sem sinais aparentes de movimentação posterior ao óbito.\n\n` +
    `Chamou a atenção da equipe a presença de uma rosa negra posicionada sobre o peito da vítima. Também foi constatada a ausência de sinais de arrombamento, indicando inicialmente que a vítima provavelmente conhecia o autor do crime.\n\n` +
    `Durante a inspeção preliminar foram identificados vestígios de sangue próximos ao corpo, além de fragmentos de uma taça de vidro quebrada na cozinha.\n\n` +
    `As primeiras diligências incluíram o isolamento da área, coleta de evidências e o encaminhamento do corpo ao IML.\n\n` +
    `Ao longo das investigações foram ouvidas diversas pessoas próximas à vítima. Os depoimentos apresentaram divergências relevantes, especialmente quanto aos horários e às últimas interações com a Daniela na noite do crime.\n\n` +
    `Nenhuma hipótese foi descartada.`;

let introTypingInterval = null;

function startIntroTypewriter() {
    const textTarget = document.getElementById("intro-narrative-text");
    const startBtn = document.getElementById("intro-start-btn");
    const skipBtn = document.getElementById("intro-skip-btn");
    if (!textTarget || !startBtn) return;
    
    if (introTypingInterval) clearInterval(introTypingInterval);
    textTarget.innerHTML = "";
    startBtn.disabled = true;
    if (skipBtn) {
        skipBtn.disabled = false;
        skipBtn.style.opacity = "1";
    }
    
    let i = 0;
    introTypingInterval = setInterval(() => {
        if (i < introNarrativeText.length) {
            const char = introNarrativeText.charAt(i);
            if (char === "\n") {
                textTarget.innerHTML += "<br>";
            } else {
                textTarget.innerHTML += char;
            }
            i++;
        } else {
            clearInterval(introTypingInterval);
            introTypingInterval = null;
            startBtn.disabled = false;
            if (skipBtn) {
                skipBtn.disabled = true;
                skipBtn.style.opacity = "0.5";
            }
        }
    }, 15);
}

function skipIntroTypewriter() {
    const textTarget = document.getElementById("intro-narrative-text");
    const startBtn = document.getElementById("intro-start-btn");
    const skipBtn = document.getElementById("intro-skip-btn");
    if (!textTarget || !startBtn) return;
    
    if (introTypingInterval) {
        clearInterval(introTypingInterval);
        introTypingInterval = null;
    }
    
    textTarget.innerHTML = introNarrativeText.replace(/\n/g, "<br>");
    startBtn.disabled = false;
    if (skipBtn) {
        skipBtn.disabled = true;
        skipBtn.style.opacity = "0.5";
    }
}

// ==========================================================================
// LABORATORY ACCESS FIREWALL BYPASS (OSCILLOSCOPE GAME)
// ==========================================================================
let lockGameActive = false;
let lockAnimationId = null;
let lockGameTimerLeft = 60;
let lockGameTimerInterval = null;
let lockStabilizerActive = false;
let targetWave = { freq: 2.2, amp: 45, phase: 120, initialized: false };
let userWave = { freq: 1.5, amp: 70, phase: 180 };

function initLabLockGame() {
    if (state.labUnlocked) return;

    // Reset overlay failure states
    const failScreen = document.getElementById("lock-fail-screen");
    if (failScreen) failScreen.classList.add("hidden");
    
    // Initialize targets randomly once per game session if not already set
    if (!targetWave.initialized) {
        targetWave.freq = parseFloat((Math.random() * 2.0 + 1.2).toFixed(2)); // 1.2 to 3.2
        targetWave.amp = Math.floor(Math.random() * 40 + 35); // 35 to 75
        targetWave.phase = Math.floor(Math.random() * 200 + 80); // 80 to 280
        targetWave.initialized = true;
    }

    // Get DOM elements
    const sliderFreq = document.getElementById("slider-freq");
    const sliderAmp = document.getElementById("slider-amp");
    const sliderPhase = document.getElementById("slider-phase");
    
    const valFreq = document.getElementById("val-freq");
    const valAmp = document.getElementById("val-amp");
    const valPhase = document.getElementById("val-phase");
    
    const btnUnlock = document.getElementById("btn-unlock-lab");
    const timerLabel = document.getElementById("lock-timer-label");
    const btnRetry = document.getElementById("btn-retry-lab-lock");
    const btnStabilizer = document.getElementById("btn-toggle-stabilizer");
    
    if (!sliderFreq || !sliderAmp || !sliderPhase) return;

    // Reset stabilizer state
    lockStabilizerActive = false;
    if (btnStabilizer) {
        btnStabilizer.classList.remove("active");
        btnStabilizer.innerHTML = `<i data-lucide="zap" class="stabilizer-btn-icon"></i> ESTABILIZAR ONDAS`;
        if (window.lucide) window.lucide.createIcons();
        
        // Remove existing listener to prevent duplicate binds
        const newBtnStabilizer = btnStabilizer.cloneNode(true);
        btnStabilizer.parentNode.replaceChild(newBtnStabilizer, btnStabilizer);
        
        newBtnStabilizer.addEventListener("click", () => {
            lockStabilizerActive = !lockStabilizerActive;
            if (lockStabilizerActive) {
                newBtnStabilizer.classList.add("active");
                newBtnStabilizer.innerHTML = `<i data-lucide="zap-off" class="stabilizer-btn-icon"></i> ESTABILIZANDO`;
            } else {
                newBtnStabilizer.classList.remove("active");
                newBtnStabilizer.innerHTML = `<i data-lucide="zap" class="stabilizer-btn-icon"></i> ESTABILIZAR ONDAS`;
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }

    // Set initial values from slider inputs
    userWave.freq = parseFloat(sliderFreq.value);
    userWave.amp = parseFloat(sliderAmp.value);
    userWave.phase = parseFloat(sliderPhase.value);

    // Update val text
    valFreq.textContent = userWave.freq.toFixed(2);
    valAmp.textContent = userWave.amp;
    valPhase.textContent = userWave.phase;

    // Reset timer state
    lockGameTimerLeft = 60;
    if (timerLabel) timerLabel.textContent = lockGameTimerLeft;
    
    if (lockGameTimerInterval) clearInterval(lockGameTimerInterval);
    lockGameTimerInterval = setInterval(() => {
        lockGameTimerLeft--;
        if (timerLabel) timerLabel.textContent = lockGameTimerLeft;
        
        if (lockGameTimerLeft <= 0) {
            clearInterval(lockGameTimerInterval);
            lockGameTimerInterval = null;
            
            // Trigger failure lock!
            stopLabLockGame();
            if (failScreen) failScreen.classList.remove("hidden");
            logSystemEvent("BLOQUEIO AUTOMÁTICO: TEMPO LIMITE DE ALINHAMENTO ESGOTADO.", "danger");
        }
    }, 1000);

    // Listeners
    const updateInputs = () => {
        if (lockGameTimerLeft <= 0) return; // ignore changes if failed
        userWave.freq = parseFloat(sliderFreq.value);
        userWave.amp = parseFloat(sliderAmp.value);
        userWave.phase = parseFloat(sliderPhase.value);
        
        valFreq.textContent = userWave.freq.toFixed(2);
        valAmp.textContent = userWave.amp;
        valPhase.textContent = userWave.phase;
        
        checkLockSync();
    };

    sliderFreq.addEventListener("input", updateInputs);
    sliderAmp.addEventListener("input", updateInputs);
    sliderPhase.addEventListener("input", updateInputs);

    // Remove existing event listener if any to prevent duplicate binds
    const newBtnUnlock = btnUnlock.cloneNode(true);
    btnUnlock.parentNode.replaceChild(newBtnUnlock, btnUnlock);

    newBtnUnlock.addEventListener("click", () => {
        state.labUnlocked = true;
        logSystemEvent("TERMINAL: ACESSO DE SEGURANÇA AUTORIZADO.", "success");
        updateInvestigationProgress(60); // progress index update
        
        // Transition views
        document.getElementById("lab-lock-screen").classList.add("hidden");
        document.getElementById("lab-main-content").classList.remove("hidden");
        
        // Stop oscilloscope loop & timer
        stopLabLockGame();
        
        // Run standard lab queue render and start lab background animations
        renderLabQueue();
        if (window.startLabAnimations) {
            window.startLabAnimations();
        }
    });

    if (btnRetry) {
        const newBtnRetry = btnRetry.cloneNode(true);
        btnRetry.parentNode.replaceChild(newBtnRetry, btnRetry);
        newBtnRetry.addEventListener("click", () => {
            // Re-initialize targets to randomize values
            targetWave.initialized = false;
            
            // Set sliders back to default center values
            sliderFreq.value = 1.5;
            sliderAmp.value = 70;
            sliderPhase.value = 180;
            
            initLabLockGame();
        });
    }

    // Start rendering oscilloscope loop
    lockGameActive = true;
    startLockOscilloscope();
    checkLockSync();
}

function checkLockSync() {
    const fDiff = Math.abs(userWave.freq - targetWave.freq);
    const aDiff = Math.abs(userWave.amp - targetWave.amp);
    const pDiff = Math.abs(userWave.phase - targetWave.phase);
    
    const btnUnlock = document.getElementById("btn-unlock-lab");
    const statusLabel = document.getElementById("lock-status-label");
    const percentLabel = document.getElementById("sync-percent-label");
    const barFill = document.getElementById("sync-bar-fill");
    
    // Limits for successful synchronization (relaxed for ease of alignment)
    const freqMatch = fDiff < 0.20;
    const ampMatch = aDiff < 10;
    const phaseMatch = pDiff < 25;
    
    if (freqMatch && ampMatch && phaseMatch) {
        // 100% matched!
        percentLabel.textContent = "100%";
        barFill.style.width = "100%";
        if (statusLabel) {
            statusLabel.textContent = "SINAL SINCRONIZADO / ACESSO PERMITIDO";
            statusLabel.className = "status-locked";
        }
        if (btnUnlock) btnUnlock.classList.remove("hidden");
    } else {
        // Calculate synchronization percentage
        const fScore = 1 - Math.min(1, fDiff / 1.8);
        const aScore = 1 - Math.min(1, aDiff / 60);
        const pScore = 1 - Math.min(1, pDiff / 180);
        
        const syncPercent = Math.max(0, Math.min(98, Math.floor((fScore * 0.4 + aScore * 0.4 + pScore * 0.2) * 100)));
        
        percentLabel.textContent = `${syncPercent}%`;
        barFill.style.width = `${syncPercent}%`;
        
        if (statusLabel) {
            statusLabel.textContent = "PROCURANDO SINAL...";
            statusLabel.className = "status-searching";
        }
        if (btnUnlock) btnUnlock.classList.add("hidden");
    }
}

function startLockOscilloscope() {
    if (lockAnimationId) cancelAnimationFrame(lockAnimationId);
    
    const canvas = document.getElementById("oscilloscope-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let timeOffset = 0;
    
    const renderFrame = () => {
        if (!lockGameActive) return;
        
        // Handle responsive resizing of canvas drawing buffer
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
            canvas.width = Math.floor(rect.width);
            canvas.height = Math.floor(rect.height);
        }
        
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        
        // Draw background grid lines (green cyber theme)
        ctx.strokeStyle = "rgba(0, 240, 255, 0.05)";
        ctx.lineWidth = 1;
        const gridSize = 20;
        
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        
        // Center horizontal line
        ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        
        // 1. Draw Target Wave (dashed green)
        ctx.strokeStyle = "rgba(57, 255, 20, 0.6)"; // Neon green
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        
        for (let x = 0; x < w; x++) {
            const radX = (x / w) * Math.PI * 4 * targetWave.freq;
            const radPhase = (targetWave.phase * Math.PI) / 180;
            const y = h / 2 + Math.sin(radX - radPhase + timeOffset) * targetWave.amp;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
        
        // 2. Draw User Wave (solid blue/cyan)
        ctx.strokeStyle = "rgba(0, 240, 255, 0.85)"; // Neon cyan
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(0, 240, 255, 0.4)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        
        for (let x = 0; x < w; x++) {
            const radX = (x / w) * Math.PI * 4 * userWave.freq;
            const radPhase = (userWave.phase * Math.PI) / 180;
            const y = h / 2 + Math.sin(radX - radPhase + timeOffset) * userWave.amp;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
        
        if (!lockStabilizerActive) {
            timeOffset += 0.04; // Animate wave movement
        }
        
        lockAnimationId = requestAnimationFrame(renderFrame);
    };
    
    lockAnimationId = requestAnimationFrame(renderFrame);
}

function stopLabLockGame() {
    lockGameActive = false;
    if (lockAnimationId) {
        cancelAnimationFrame(lockAnimationId);
        lockAnimationId = null;
    }
    if (lockGameTimerInterval) {
        clearInterval(lockGameTimerInterval);
        lockGameTimerInterval = null;
    }
}

// Expose lock functions globally
window.initLabLockGame = initLabLockGame;
window.stopLabLockGame = stopLabLockGame;
