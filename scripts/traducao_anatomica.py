"""Tradução determinística dos rótulos anatômicos do BodyParts3D para PT-BR.

O objetivo deste módulo é garantir que nenhum rótulo de exibição dependa de um
fallback em inglês. Os IDs FMA/FJ e os nomes originais continuam preservados no
manifesto localizado como metadados de rastreabilidade.

A tradução combina:
1. equivalências exatas para estruturas anatômicas frequentes;
2. equivalências de expressões técnicas e nomenclatura muscular;
3. tradução lexical para rótulos compostos;
4. regras simples de ordem de palavras para nomes que terminam em um núcleo
   anatômico, como artery, vein, bone, muscle e nerve.

O tradutor não modifica identificadores científicos nem os buffers geométricos.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Traduções exatas têm prioridade. Elas são usadas quando a forma consagrada em
# português difere bastante de uma tradução palavra a palavra.
EXATAS: dict[str, str] = {
    'heart': 'coração',
    'right side': 'lado direito',
    'abdominal aorta': 'aorta abdominal',
    'inferior nasal concha': 'concha nasal inferior',
    'flexor accessorius': 'flexor acessório',
    'linea alba': 'linha alba',
    'mons pubis': 'monte do púbis',
    'left side': 'lado esquerdo',
    'brain': 'encéfalo',
    'liver': 'fígado',
    'stomach': 'estômago',
    'spleen': 'baço',
    'pancreas': 'pâncreas',
    'urinary bladder': 'bexiga urinária',
    'gallbladder': 'vesícula biliar',
    'small intestine': 'intestino delgado',
    'large intestine': 'intestino grosso',
    'spinal cord': 'medula espinhal',
    'brainstem': 'tronco encefálico',
    'medulla oblongata': 'bulbo',
    'pituitary gland': 'hipófise',
    'pineal gland': 'glândula pineal',
    'thyroid gland': 'glândula tireoide',
    'adrenal gland': 'glândula suprarrenal',
    'parotid gland': 'glândula parótida',
    'submandibular gland': 'glândula submandibular',
    'sublingual gland': 'glândula sublingual',
    'lacrimal gland': 'glândula lacrimal',
    'thymus': 'timo',
    'esophagus': 'esôfago',
    'oesophagus': 'esôfago',
    'pharynx': 'faringe',
    'nasopharynx': 'nasofaringe',
    'oropharynx': 'orofaringe',
    'laryngopharynx': 'laringofaringe',
    'larynx': 'laringe',
    'trachea': 'traqueia',
    'bronchus': 'brônquio',
    'lung': 'pulmão',
    'diaphragm': 'diafragma',
    'kidney': 'rim',
    'ureter': 'ureter',
    'urethra': 'uretra',
    'prostate': 'próstata',
    'testis': 'testículo',
    'epididymis': 'epidídimo',
    'seminal vesicle': 'vesícula seminal',
    'penis': 'pênis',
    'glans penis': 'glande do pênis',
    'rectum': 'reto',
    'anus': 'ânus',
    'appendix': 'apêndice vermiforme',
    'cecum': 'ceco',
    'duodenum': 'duodeno',
    'jejunum': 'jejuno',
    'ileum': 'íleo',
    'colon': 'cólon',
    'sigmoid colon': 'cólon sigmoide',
    'aorta': 'aorta',
    'vena cava': 'veia cava',
    'superior vena cava': 'veia cava superior',
    'inferior vena cava': 'veia cava inferior',
    'femur': 'fêmur',
    'humerus': 'úmero',
    'radius': 'rádio',
    'ulna': 'ulna',
    'tibia': 'tíbia',
    'fibula': 'fíbula',
    'patella': 'patela',
    'scapula': 'escápula',
    'clavicle': 'clavícula',
    'sternum': 'esterno',
    'sacrum': 'sacro',
    'coccyx': 'cóccix',
    'mandible': 'mandíbula',
    'maxilla': 'maxila',
    'hyoid': 'hioide',
    'talus': 'tálus',
    'calcaneus': 'calcâneo',
    'navicular': 'navicular',
    'cuboid': 'cuboide',
    'scaphoid': 'escafoide',
    'lunate': 'semilunar',
    'triquetral': 'piramidal',
    'pisiform': 'pisiforme',
    'trapezium': 'trapézio',
    'trapezoid': 'trapezoide',
    'capitate': 'capitato',
    'hamate': 'hamato',
    'metacarpal bone': 'metacarpo',
    'metatarsal bone': 'metatarso',
    'carpal bone': 'osso do carpo',
    'tarsal bone': 'osso do tarso',
    'phalanx of finger': 'falange da mão',
    'phalanx of toe': 'falange do pé',
    'intervertebral disk': 'disco intervertebral',
    'intervertebral symphysis': 'sínfise intervertebral',
    'vertebral column': 'coluna vertebral',
    'cervical vertebral column': 'coluna vertebral cervical',
    'thoracic vertebral column': 'coluna vertebral torácica',
    'lumbar vertebral column': 'coluna vertebral lombar',
    'shoulder girdle': 'cintura escapular',
    'pelvic girdle': 'cintura pélvica',
    'eyeball': 'globo ocular',
    'eye': 'olho',
    'eyelid': 'pálpebra',
    'eyebrow': 'sobrancelha',
    'cornea': 'córnea',
    'sclera': 'esclera',
    'iris': 'íris',
    'retina': 'retina',
    'lens': 'cristalino',
    'choroid': 'coroide',
    'optic nerve': 'nervo óptico',
    'oculomotor nerve': 'nervo oculomotor',
    'trochlear nerve': 'nervo troclear',
    'trigeminal nerve': 'nervo trigêmeo',
    'facial nerve': 'nervo facial',
    'ear': 'orelha',
    'nose': 'nariz',
    'mouth': 'boca',
    'tongue': 'língua',
    'palate': 'palato',
    'uvula': 'úvula',
    'gingiva': 'gengiva',
    'tooth': 'dente',
    'skin': 'pele',
    'cerebrum': 'cérebro',
    'cerebellum': 'cerebelo',
    'thalamus': 'tálamo',
    'hypothalamus': 'hipotálamo',
    'hippocampus': 'hipocampo',
    'amygdala': 'amígdala',
    'putamen': 'putâmen',
    'globus pallidus': 'globo pálido',
    'corpus callosum': 'corpo caloso',
    'fornix': 'fórnice',
    'pons': 'ponte',
    'telencephalon': 'telencéfalo',
    'diencephalon': 'diencéfalo',
    'midbrain': 'mesencéfalo',
    'forebrain': 'prosencéfalo',
    'hindbrain': 'rombencéfalo',
    'cerebral cortex': 'córtex cerebral',
    'white matter': 'substância branca',
    'gray matter': 'substância cinzenta',
}

# Expressões técnicas que devem ser reconhecidas antes da tradução por palavras.
# A ordem é relevante: as expressões mais longas são aplicadas primeiro.
FRASES: dict[str, str] = {
    'anterior interventricular': 'interventricular anterior',
    'posterior interventricular': 'interventricular posterior',
    'anterior descending': 'descendente anterior',
    'posterior descending': 'descendente posterior',
    'anterior communicating': 'comunicante anterior',
    'posterior communicating': 'comunicante posterior',
    'anterior cerebral': 'cerebral anterior',
    'middle cerebral': 'cerebral média',
    'posterior cerebral': 'cerebral posterior',
    'anterior choroidal': 'coroidea anterior',
    'posterior choroidal': 'coroidea posterior',
    'superior cerebellar': 'cerebelar superior',
    'anterior inferior cerebellar': 'cerebelar anteroinferior',
    'posterior inferior cerebellar': 'cerebelar posteroinferior',
    'common carotid': 'carótida comum',
    'internal carotid': 'carótida interna',
    'external carotid': 'carótida externa',
    'common iliac': 'ilíaca comum',
    'internal iliac': 'ilíaca interna',
    'external iliac': 'ilíaca externa',
    'deep femoral': 'femoral profunda',
    'superficial femoral': 'femoral superficial',
    'great saphenous': 'safena magna',
    'small saphenous': 'safena parva',
    'portal vein': 'veia porta',
    'hepatic portal': 'porta hepática',
    'pulmonary artery': 'artéria pulmonar',
    'pulmonary vein': 'veia pulmonar',
    'coronary artery': 'artéria coronária',
    'coronary vein': 'veia coronária',
    'renal artery': 'artéria renal',
    'renal vein': 'veia renal',
    'femoral artery': 'artéria femoral',
    'femoral vein': 'veia femoral',
    'brachial artery': 'artéria braquial',
    'radial artery': 'artéria radial',
    'ulnar artery': 'artéria ulnar',
    'tibial artery': 'artéria tibial',
    'popliteal artery': 'artéria poplítea',
    'axillary artery': 'artéria axilar',
    'subclavian artery': 'artéria subclávia',
    'vertebral artery': 'artéria vertebral',
    'dorsal metacarpal arteries': 'artérias metacarpais dorsais',
    'dorsal metacarpal artery': 'artéria metacarpal dorsal',
    'dorsal metacarpal vein': 'veia metacarpal dorsal',
    'palmar metacarpal artery': 'artéria metacarpal palmar',
    'palmar metacarpal vein': 'veia metacarpal palmar',
    'dorsal digital artery': 'artéria digital dorsal',
    'palmar digital artery': 'artéria digital palmar',
    'plantar digital artery': 'artéria digital plantar',
    'proper palmar digital artery': 'artéria digital palmar própria',
    'interosseous artery': 'artéria interóssea',
    'interosseous vein': 'veia interóssea',
    'segmental artery': 'artéria segmentar',
    'segmental vein': 'veia segmentar',
    'bronchial artery': 'artéria brônquica',
    'bronchial vein': 'veia brônquica',
    'hepatic artery': 'artéria hepática',
    'hepatic vein': 'veia hepática',
    'cystic artery': 'artéria cística',
    'gastric artery': 'artéria gástrica',
    'splenic artery': 'artéria esplênica',
    'splenic vein': 'veia esplênica',
    'mesenteric artery': 'artéria mesentérica',
    'mesenteric vein': 'veia mesentérica',
    'pancreaticoduodenal artery': 'artéria pancreaticoduodenal',
    'ileocolic artery': 'artéria ileocólica',
    'colic artery': 'artéria cólica',
    'epigastric artery': 'artéria epigástrica',
    'circumflex artery': 'artéria circunflexa',
    'genicular artery': 'artéria genicular',
    'phrenic artery': 'artéria frênica',
    'ophthalmic artery': 'artéria oftálmica',
    'ciliary artery': 'artéria ciliar',
    'central sulcus': 'sulco central',
    'precentral sulcus': 'sulco pré-central',
    'postcentral sulcus': 'sulco pós-central',
    'precentral gyrus': 'giro pré-central',
    'postcentral gyrus': 'giro pós-central',
    'cingulate gyrus': 'giro do cíngulo',
    'angular gyrus': 'giro angular',
    'supramarginal gyrus': 'giro supramarginal',
    'fusiform gyrus': 'giro fusiforme',
    'parahippocampal gyrus': 'giro parahipocampal',
    'superior frontal gyrus': 'giro frontal superior',
    'middle frontal gyrus': 'giro frontal médio',
    'inferior frontal gyrus': 'giro frontal inferior',
    'superior temporal gyrus': 'giro temporal superior',
    'middle temporal gyrus': 'giro temporal médio',
    'inferior temporal gyrus': 'giro temporal inferior',
    'orbital gyrus': 'giro orbital',
    'cerebral hemisphere': 'hemisfério cerebral',
    'cerebellar hemisphere': 'hemisfério cerebelar',
    'internal capsule': 'cápsula interna',
    'external capsule': 'cápsula externa',
    'optic chiasm': 'quiasma óptico',
    'optic tract': 'trato óptico',
    'spinal nerve': 'nervo espinhal',
    'cranial nerve': 'nervo craniano',
    'intercostal nerve': 'nervo intercostal',
    'sciatic nerve': 'nervo ciático',
    'femoral nerve': 'nervo femoral',
    'ulnar nerve': 'nervo ulnar',
    'radial nerve': 'nervo radial',
    'median nerve': 'nervo mediano',
    'common bile duct': 'ducto colédoco',
    'bile duct': 'ducto biliar',
    'pancreatic duct': 'ducto pancreático',
    'cystic duct': 'ducto cístico',
    'hepatic duct': 'ducto hepático',
    'nasolacrimal duct': 'ducto nasolacrimal',
    'thoracic duct': 'ducto torácico',
    'aortic valve': 'valva aórtica',
    'mitral valve': 'valva mitral',
    'tricuspid valve': 'valva tricúspide',
    'pulmonary valve': 'valva pulmonar',
    'right atrium': 'átrio direito',
    'left atrium': 'átrio esquerdo',
    'right ventricle': 'ventrículo direito',
    'left ventricle': 'ventrículo esquerdo',
    'myocardium': 'miocárdio',
    'interventricular septum': 'septo interventricular',
    'nasal cavity': 'cavidade nasal',
    'oral cavity': 'cavidade oral',
    'thoracic cavity': 'cavidade torácica',
    'abdominal cavity': 'cavidade abdominal',
    'pelvic cavity': 'cavidade pélvica',
    'abdominal wall': 'parede abdominal',
    'thoracic wall': 'parede torácica',
    'chest wall': 'parede torácica',
    'carpal bone': 'osso do carpo',
    'metacarpal bone': 'metacarpo',
    'tarsal bone': 'osso do tarso',
    'metatarsal bone': 'metatarso',
    'cervical vertebra': 'vértebra cervical',
    'thoracic vertebra': 'vértebra torácica',
    'lumbar vertebra': 'vértebra lombar',
    'index finger': 'dedo indicador',
    'middle finger': 'dedo médio',
    'ring finger': 'dedo anular',
    'little finger': 'dedo mínimo',
    'big toe': 'hálux',
    'little toe': 'dedo mínimo do pé',
    'second toe': 'segundo dedo do pé',
    'third toe': 'terceiro dedo do pé',
    'fourth toe': 'quarto dedo do pé',
    'distal phalanx': 'falange distal',
    'middle phalanx': 'falange média',
    'proximal phalanx': 'falange proximal',
    'flexor pollicis longus': 'flexor longo do polegar',
    'flexor pollicis brevis': 'flexor curto do polegar',
    'extensor pollicis longus': 'extensor longo do polegar',
    'extensor pollicis brevis': 'extensor curto do polegar',
    'abductor pollicis longus': 'abdutor longo do polegar',
    'abductor pollicis brevis': 'abdutor curto do polegar',
    'adductor pollicis': 'adutor do polegar',
    'opponens pollicis': 'oponente do polegar',
    'flexor digitorum profundus': 'flexor profundo dos dedos',
    'flexor digitorum superficialis': 'flexor superficial dos dedos',
    'extensor digitorum': 'extensor dos dedos',
    'extensor digiti minimi': 'extensor do dedo mínimo',
    'flexor digiti minimi': 'flexor do dedo mínimo',
    'abductor digiti minimi': 'abdutor do dedo mínimo',
    'opponens digiti minimi': 'oponente do dedo mínimo',
    'extensor indicis': 'extensor do indicador',
    'flexor hallucis longus': 'flexor longo do hálux',
    'flexor hallucis brevis': 'flexor curto do hálux',
    'extensor hallucis longus': 'extensor longo do hálux',
    'extensor hallucis brevis': 'extensor curto do hálux',
    'abductor hallucis': 'abdutor do hálux',
    'adductor hallucis': 'adutor do hálux',
    'tibialis anterior': 'tibial anterior',
    'tibialis posterior': 'tibial posterior',
    'fibularis longus': 'fibular longo',
    'fibularis brevis': 'fibular curto',
    'fibularis tertius': 'fibular terceiro',
    'biceps brachii': 'bíceps braquial',
    'triceps brachii': 'tríceps braquial',
    'biceps femoris': 'bíceps femoral',
    'rectus femoris': 'reto femoral',
    'rectus abdominis': 'reto do abdome',
    'pectoralis major': 'peitoral maior',
    'pectoralis minor': 'peitoral menor',
    'gluteus maximus': 'glúteo máximo',
    'gluteus medius': 'glúteo médio',
    'gluteus minimus': 'glúteo mínimo',
    'adductor longus': 'adutor longo',
    'adductor brevis': 'adutor curto',
    'adductor magnus': 'adutor magno',
    'vastus lateralis': 'vasto lateral',
    'vastus medialis': 'vasto medial',
    'vastus intermedius': 'vasto intermédio',
    'gastrocnemius': 'gastrocnêmio',
    'soleus': 'sóleo',
    'plantaris': 'plantar',
    'popliteus': 'poplíteo',
    'sartorius': 'sartório',
    'gracilis': 'grácil',
    'semitendinosus': 'semitendíneo',
    'semimembranosus': 'semimembranáceo',
    'supraspinatus': 'supraespinal',
    'infraspinatus': 'infraespinal',
    'subscapularis': 'subescapular',
    'teres major': 'redondo maior',
    'teres minor': 'redondo menor',
    'deltoid': 'deltoide',
    'trapezius': 'trapézio',
    'latissimus dorsi': 'latíssimo do dorso',
    'sternocleidomastoid': 'esternocleidomastoideo',
    'brachioradialis': 'braquiorradial',
    'coracobrachialis': 'coracobraquial',
    'pronator teres': 'pronador redondo',
    'pronator quadratus': 'pronador quadrado',
    'supinator': 'supinador',
    'palmaris longus': 'palmar longo',
    'palmaris brevis': 'palmar curto',
    'levator scapulae': 'levantador da escápula',
    'serratus anterior': 'serrátil anterior',
    'quadratus lumborum': 'quadrado lombar',
    'iliopsoas': 'iliopsoas',
    'piriformis': 'piriforme',
    'obturator internus': 'obturador interno',
    'obturator externus': 'obturador externo',
    'levator ani': 'levantador do ânus',
    'coccygeus': 'coccígeo',
    'mylohyoid': 'milo-hióideo',
    'geniohyoid': 'gênio-hióideo',
    'stylohyoid': 'estilo-hióideo',
    'sternohyoid': 'esterno-hióideo',
    'sternothyroid': 'esternotireóideo',
    'omohyoid': 'omo-hióideo',
    'cricothyroid': 'cricotireóideo',
    'thyrohyoid': 'tireo-hióideo',
    'genioglossus': 'genioglosso',
    'hyoglossus': 'hioglosso',
    'stylopharyngeus': 'estilofaríngeo',
    'salpingopharyngeus': 'salpingofaríngeo',
    'palatopharyngeus': 'palatofaríngeo',
}

# Tradução lexical. Mantemos aqui tanto inglês quanto formas latinas muito comuns
# em nomes musculares; isso evita que o usuário veja termos como longus/brevis.
PALAVRAS: dict[str, str] = {
    'anal':'anal','anastomosis':'anastomose','antero':'antero','appendicular':'apendicular',
    'auriculotemporal':'auriculotemporal','basilar':'basilar','basilic':'basílico','caudal':'caudal',
    'cephalic':'cefálico','coli':'do cólon','cord':'medula','costocervical':'costocervical',
    'cricothyroid':'cricotireóideo','cystic':'cístico','decussation':'decussação','diaphragm':'diafragma',
    'digital':'digital','dorsal':'dorsal','dorsalis':'dorsal','epididymis':'epidídimo',
    'epiglottis':'epiglote','eyebrow':'sobrancelha','facial':'facial','gallbladder':'vesícula biliar',
    'globus':'globo','gray':'cinzento','hemisphere':'hemisfério','hypothalamus':'hipotálamo',
    'infrahyoid':'infra-hióideo','infratrochlear':'infratroclear','intracranial':'intracraniano',
    'investing':'de revestimento','laryngopharynx':'laringofaringe','median':'mediano',
    'mediastinum':'mediastino','metencephalon':'metencéfalo','musculoskeletal':'musculoesquelético',
    'myocardium':'miocárdio','nasolacrimal':'nasolacrimal','oblique':'oblíquo','oblongata':'oblonga',
    'omohyoid':'omo-hióideo','palmar':'palmar','palmaris':'palmar','paracentral':'paracentral',
    'pectoral':'peitoral','pedis':'do pé','penis':'pênis','plantar':'plantar','plexus':'plexo',
    'pons':'ponte','quadriceps':'quadríceps','sigmoid':'sigmoide','sternohyoid':'esterno-hióideo',
    'sternothyroid':'esternotireóideo','stylohyoid':'estilo-hióideo','sublingual':'sublingual',
    'submandibular':'submandibular','subscapular':'subescapular','suprahyoid':'supra-hióideo',
    'suprascapular':'supraescapular','supratrochlear':'supratroclear','temporo':'temporo',
    'tertius':'terceiro','thymus':'timo','thyrocervical':'tireocervical','thyrohyoid':'tireo-hióideo',
    'tibialis':'tibial','trunk':'tronco','uvula':'úvula','variant':'variante','vasculature':'vasculatura',
    'white':'branco',
    'of':'de','to':'para','in':'em','with':'com','and':'e','or':'ou','the':'',
    'right':'direito','left':'esquerdo','anterior':'anterior','posterior':'posterior',
    'superior':'superior','inferior':'inferior','lateral':'lateral','medial':'medial',
    'middle':'médio','central':'central','internal':'interno','external':'externo',
    'upper':'superior','lower':'inferior','deep':'profundo','superficial':'superficial',
    'distal':'distal','proximal':'proximal','basal':'basal','apical':'apical',
    'common':'comum','proper':'próprio','secondary':'secundário','primary':'primário',
    'accessory':'acessório','main':'principal','free':'livre','small':'pequeno','large':'grande',
    'great':'grande','long':'longo','short':'curto','flat':'plano','true':'verdadeiro',
    'false':'falso','floating':'flutuante','typical':'típico','atypical':'atípico',
    'intermediate':'intermédio','innermost':'mais interno','intrinsic':'intrínseco',
    'extrinsic':'extrínseco','irregular':'irregular','solid':'sólido','hollow':'oco',
    'physical':'físico','material':'material','immaterial':'imaterial','human':'humano',
    'heterogeneous':'heterogêneo','cavitated':'cavitado','pneumatized':'pneumatizado',
    'loose':'frouxo','mucoid':'mucoide','bony':'ósseo','osseous':'ósseo',
    'cartilaginous':'cartilaginoso','fibrous':'fibroso','membranous':'membranoso',
    'parenchymatous':'parenquimatoso','nonparenchymatous':'não parenquimatoso',
    'nonskeletal':'não esquelético','skeletal':'esquelético','anatomical':'anatômico',
    'artery':'artéria','arteries':'artérias','arterial':'arterial','arteria':'artéria',
    'vein':'veia','veins':'veias','venous':'venoso','vena':'veia','vascular':'vascular',
    'branch':'ramo','branches':'ramos','tributary':'tributária','tree':'árvore',
    'segmental':'segmentar','segment':'segmento','subsegmental':'subsegmentar',
    'subsector':'subsetor','sector':'setor','division':'divisão','subdivision':'subdivisão',
    'subdivisionof':'subdivisão de','part':'parte','parts':'partes','portion':'porção',
    'component':'componente','entity':'entidade','structure':'estrutura','organ':'órgão',
    'organs':'órgãos','system':'sistema','network':'rede','cluster':'grupo','clusters':'grupos',
    'set':'conjunto','region':'região','regions':'regiões','zone':'zona','compartment':'compartimento',
    'content':'conteúdo','boundary':'limite','continuity':'continuidade','junction':'junção',
    'process':'processo','apparatus':'aparelho','appendage':'apêndice','conduit':'conduto',
    'bone':'osso','vertebra':'vértebra','vertebrae':'vértebras','rib':'costela',
    'cartilage':'cartilagem','ligament':'ligamento','symphysis':'sínfise','disk':'disco',
    'skeleton':'esqueleto','girdle':'cintura','column':'coluna','plate':'placa',
    'skull':'crânio','basicranium':'base do crânio','neurocranium':'neurocrânio',
    'viscerocranium':'viscerocrânio','basicranial':'basicraniano','axial':'axial',
    'metacarpal':'metacarpal','metatarsal':'metatarsal','carpal':'cárpico','tarsal':'társico',
    'cuneiform':'cuneiforme','sesamoid':'sesamoide','patellar':'patelar','articular':'articular',
    'phalanx':'falange','finger':'dedo da mão','toe':'dedo do pé','thumb':'polegar',
    'index':'indicador','ring':'anular','little':'mínimo','big':'maior','hand':'mão','foot':'pé',
    'wrist':'punho','forearm':'antebraço','arm':'braço','shoulder':'ombro','leg':'perna',
    'thigh':'coxa','hip':'quadril','knee':'joelho','neck':'pescoço','chest':'tórax',
    'thorax':'tórax','abdomen':'abdome','back':'dorso','face':'face','cheek':'bochecha',
    'jaw':'mandíbula','lip':'lábio','head':'cabeça','limb':'membro','side':'lado',
    'muscle':'músculo','musculature':'musculatura','tendon':'tendão','tendinous':'tendíneo',
    'fascia':'fáscia','fascial':'fascial','rotator':'rotador','flexor':'flexor','extensor':'extensor',
    'abductor':'abdutor','adductor':'adutor','levator':'levantador','constrictor':'constritor',
    'pronator':'pronador','tensor':'tensor','opponens':'oponente','lumbrical':'lumbrical',
    'lumbricals':'lumbricais','interosseous':'interósseo','interossei':'interósseos',
    'longus':'longo','brevis':'curto','longi':'longos','breves':'curtos','major':'maior',
    'minor':'menor','maximus':'máximo','minimus':'mínimo','medius':'médio','magnus':'magno',
    'profundus':'profundo','superficialis':'superficial','internus':'interno','externus':'externo',
    'lateralis':'lateral','medialis':'medial','intermedius':'intermédio','superioris':'superior',
    'pollicis':'do polegar','hallucis':'do hálux','digitorum':'dos dedos','digiti':'do dedo',
    'minimi':'mínimo','indicis':'do indicador','carpi':'do carpo','radialis':'radial',
    'ulnaris':'ulnar','brachii':'braquial','femoris':'femoral','capitis':'da cabeça',
    'cervicis':'cervical','thoracis':'torácico','lumborum':'lombar','colli':'do pescoço',
    'scapulae':'da escápula','fasciae':'da fáscia','latae':'lata','palpebrae':'da pálpebra',
    'costarum':'das costelas','veli':'do véu','palatini':'palatino','ani':'do ânus',
    'cerebral':'cerebral','cerebellar':'cerebelar','frontal':'frontal','temporal':'temporal',
    'parietal':'parietal','occipital':'occipital','prefrontal':'pré-frontal','insular':'insular',
    'limbic':'límbico','hippocampal':'hipocampal','parahippocampal':'parahipocampal',
    'cingulate':'cingulado','supramarginal':'supramarginal','fusiform':'fusiforme',
    'precentral':'pré-central','postcentral':'pós-central','angular':'angular','precuneal':'pré-cuneal',
    'neuraxis':'neuroeixo','gyrus':'giro','sulcus':'sulco','cortex':'córtex','subcortex':'subcórtex',
    'archicortex':'arquicórtex','matter':'substância','nucleus':'núcleo','nuclear':'nuclear',
    'ganglion':'gânglio','tract':'trato','commissure':'comissura','septum':'septo','fornix':'fórnice',
    'thalamus':'tálamo','hypothalamic':'hipotalâmico','pontine':'pontino','medulla':'medula',
    'cerebellum':'cerebelo','telencephalon':'telencéfalo','diencephalon':'diencéfalo',
    'forebrain':'prosencéfalo','midbrain':'mesencéfalo','hindbrain':'rombencéfalo',
    'brain':'encéfalo','brainstem':'tronco encefálico','chiasm':'quiasma','peduncle':'pedúnculo',
    'colliculus':'colículo','habenula':'habênula','tectum':'teto','insula':'ínsula',
    'raphe':'rafe','lamina':'lâmina','formation':'formação','complex':'complexo',
    'circumventricular':'circunventricular','interpeduncular':'interpeduncular',
    'nerve':'nervo','nervous':'nervoso','neural':'neural','spinal':'espinhal','cranial':'craniano',
    'autonomic':'autônomo','parasympathetic':'parassimpático','trigeminal':'trigeminal',
    'oculomotor':'oculomotor','trochlear':'troclear','geniculate':'geniculado','ciliary':'ciliar',
    'nasociliary':'nasociliar','optic':'óptico','orbital':'orbital','ophthalmic':'oftálmico',
    'thoracic':'torácico','cervical':'cervical','lumbar':'lombar','sacral':'sacral',
    'vertebral':'vertebral','intervertebral':'intervertebral','postvertebral':'pós-vertebral',
    'prevertebral':'pré-vertebral','suboccipital':'suboccipital','intercostal':'intercostal',
    'costal':'costal','subcostal':'subcostal','sternal':'esternal','sternocostal':'esternocostal',
    'clavicular':'clavicular','scapular':'escapular','humeral':'umeral','brachial':'braquial',
    'radial':'radial','ulnar':'ulnar','cubital':'cubital','antebrachial':'antebraquial',
    'femoral':'femoral','tibial':'tibial','fibular':'fibular','fibularis':'fibular',
    'popliteal':'poplíteo','gluteal':'glúteo','iliac':'ilíaco','iliolumbar':'iliolombar',
    'iliotibial':'iliotibial','pelvic':'pélvico','pubic':'púbico','abdominal':'abdominal',
    'epigastric':'epigástrico','mesenteric':'mesentérico','colic':'cólico','ileal':'ileal',
    'ileocolic':'ileocólico','ileocecal':'ileocecal','cecal':'cecal','rectal':'retal',
    'gastric':'gástrico','gastro':'gastro','gastrointestinal':'gastrointestinal',
    'gastroepiploic':'gastroepiploico','gastroduodenal':'gastroduodenal','pancreatic':'pancreático',
    'pancreaticoduodenal':'pancreaticoduodenal','splenic':'esplênico','hepatic':'hepático',
    'hepatovenous':'hepaticovenoso','extrahepatic':'extra-hepático','intrahepatic':'intra-hepático',
    'biliary':'biliar','pancreaticobiliary':'pancreatobiliar','portal':'porta','renal':'renal',
    'suprarenal':'suprarrenal','testicular':'testicular','urinary':'urinário','ureteric':'ureteral',
    'cardiac':'cardíaco','coronary':'coronário','interventricular':'interventricular',
    'ventricular':'ventricular','atrium':'átrio','ventricle':'ventrículo','myocardial':'miocárdico',
    'subendocardial':'subendocárdico','aortic':'aórtico','mitral':'mitral','tricuspid':'tricúspide',
    'valve':'valva','leaflet':'folheto','cusp':'cúspide','papillary':'papilar','chamber':'câmara',
    'inflow':'entrada','outflow':'saída','conus':'cone','septal':'septal','cardiovascular':'cardiovascular',
    'pulmonary':'pulmonar','bronchial':'brônquico','bronchopulmonary':'broncopulmonar',
    'intrapulmonary':'intrapulmonar','respiratory':'respiratório','phrenic':'frênico',
    'pulmopleural':'pulmopleural','tracheobronchial':'traqueobrônquico','lingular':'lingular',
    'nasal':'nasal','pharyngeal':'faríngeo','laryngeal':'laríngeo','epiglottic':'epiglótico',
    'cricoid':'cricoide','arytenoid':'aritenoide','corniculate':'corniculado','vocal':'vocal',
    'elasticus':'elástico','thyroid':'tireoide','hyo':'hio','thyro':'tireo','crico':'crico',
    'pterygomandibular':'pterigomandibular','faucial':'faucial','uvular':'uvular',
    'salivary':'salivar','lingual':'lingual','palatine':'palatino','maxillary':'maxilar',
    'mandibular':'mandibular','zygomatic':'zigomático','ethmoid':'etmoide','ethmoidal':'etmoidal',
    'sphenoid':'esfenoide','lacrimal':'lacrimal','concha':'concha','vomer':'vômer',
    'oral':'oral','esophageal':'esofágico','oesophageal':'esofágico','alimentary':'alimentar',
    'peritoneal':'peritoneal','peritoneum':'peritônio','visceral':'visceral','mesentery':'mesentério',
    'mesocolon':'mesocólon','mesoappendix':'mesoapêndice','omentalis':'omental','epiploic':'epiploico',
    'intestinal':'intestinal','intestine':'intestino','bile':'bile','duct':'ducto','gland':'glândula',
    'capsule':'cápsula','sac':'saco','cavity':'cavidade','space':'espaço','wall':'parede','layer':'camada',
    'membrane':'membrana','epithelium':'epitélio','epidermis':'epiderme','tissue':'tecido',
    'connective':'conjuntivo','serous':'seroso','parenchyma':'parênquima','corticomedullary':'corticomedular',
    'skin':'pele','hair':'pelo','hairs':'pelos','integument':'tegumento','integumentary':'tegumentar',
    'sphincter':'esfíncter','perineal':'perineal','perineum':'períneo','genital':'genital',
    'deferent':'deferente','cavernous':'cavernoso','cavernosum':'cavernoso','spongiosum':'esponjoso',
    'seminal':'seminal','vesicle':'vesícula','glans':'glande','bladder':'bexiga','adrenal':'suprarrenal',
    'kidney':'rim','testis':'testículo','prostate':'próstata','ureter':'ureter','urethra':'uretra',
    'liver':'fígado','pancreas':'pâncreas','spleen':'baço','stomach':'estômago','duodenum':'duodeno',
    'jejunum':'jejuno','ileum':'íleo','colon':'cólon','rectum':'reto','cecum':'ceco','appendix':'apêndice',
    'esophagus':'esôfago','oesophagus':'esôfago','pharynx':'faringe','larynx':'laringe','trachea':'traqueia',
    'bronchus':'brônquio','lung':'pulmão','heart':'coração','aorta':'aorta','cava':'cava',
    'sinus':'seio','azygos':'ázigos','hemiazygos':'hemiázigos','jugular':'jugular','subclavian':'subclávio',
    'axillary':'axilar','saphenous':'safeno','carotid':'carótida','brachiocephalic':'braquiocefálico',
    'celiac':'celíaco','coeliac':'celíaco','pudendal':'pudendo','obturator':'obturador',
    'circumflex':'circunflexo','acromial':'acromial','thoracodorsal':'toracodorsal',
    'thoraco':'toraco','musculophrenic':'musculofrênico','genicular':'genicular','recurrent':'recorrente',
    'communicating':'comunicante','collateral':'colateral','perforating':'perfurante','marginal':'marginal',
    'descending':'descendente','ascending':'ascendente','transverse':'transverso','diagonal':'diagonal',
    'arcuate':'arqueado','callosomarginal':'calosomarginal','pericallosal':'pericaloso',
    'choroidal':'coroideo','thalamoperforating':'talamoperfurante','thalamogeniculate':'talamogeniculado',
    'precommunicating':'pré-comunicante','postcommunicating':'pós-comunicante','frontobasal':'frontobasal',
    'anterolateral':'anterolateral','posteromedial':'posteromedial','inferomedial':'inferomedial',
    'intermediomedial':'intermediomedial','laterobasal':'laterobasal','mediobasal':'mediobasal',
    'subsuperior':'subsuperior','apicoposterior':'apicoposterior','polar':'polar','vermian':'vermiano',
    'lobar':'lobar','lobular':'lobular','lobe':'lobo','lobule':'lóbulo','caudate':'caudado',
    'hemiliver':'hemifígado','intrapulmonary':'intrapulmonar','cage':'caixa','thoracodorsal':'toracodorsal',
    'first':'1º','second':'2º','third':'3º','fourth':'4º','fifth':'5º','sixth':'6º','seventh':'7º',
    'eighth':'8º','ninth':'9º','tenth':'10º','eleventh':'11º','twelfth':'12º',
    'i':'I','ii':'II','iii':'III','iv':'IV','v':'V','vi':'VI','vii':'VII','viii':'VIII','ix':'IX',
    'body':'corpo','root':'raiz','arch':'arco','circle':'círculo','line':'linha','leaf':'folha',
    'incisure':'incisura','foramen':'forame','fossa':'fossa','canal':'canal','aqueduct':'aqueduto',
    'cell':'célula','corona':'coroa','trochlea':'tróclea','retinaculum':'retináculo','stria':'estria',
    'taenia':'tênia','tuber':'túber','dorsum':'dorso','brachium':'braço','corpus':'corpo',
    'lamina':'lâmina','ciliaris':'ciliar','medullaris':'medular','terminalis':'terminal',
    'terminal':'terminal','princeps':'principal','supreme':'supremo','supra':'supra',
    'check':'controle','lake':'lago','alar':'alar','suspensory':'suspensor','vitreous':'vítreo',
    'canaliculus':'canalículo','orbit':'órbita','ocular':'ocular','eye':'olho','eyeball':'globo ocular',
    'eyelid':'pálpebra','nose':'nariz','mouth':'boca','tongue':'língua','palate':'palato','ear':'orelha',
    'lens':'cristalino','retina':'retina','iris':'íris','cornea':'córnea','sclera':'esclera','choroid':'coroide',
    'gingiva':'gengiva','tooth':'dente','incisor':'incisivo','molar':'molar','premolar':'pré-molar','canine':'canino',
    'dura':'dura','mater':'máter','subarachnoid':'subaracnoideo','tentorium':'tentório','cerebelli':'do cerebelo',
    'sacrum':'sacro','axis':'áxis','atlas':'atlas','pelvis':'pelve','sternum':'esterno','manubrium':'manúbrio',
    'xiphoid':'xifoide','femur':'fêmur','humerus':'úmero','radius':'rádio','ulna':'ulna','tibia':'tíbia',
    'fibula':'fíbula','patella':'patela','talus':'tálus','calcaneus':'calcâneo','maxilla':'maxila','clavicle':'clavícula',
    'scapula':'escápula','scaphoid':'escafoide','lunate':'semilunar','triquetral':'piramidal','pisiform':'pisiforme',
    'trapezium':'trapézio','trapezoid':'trapezoide','capitate':'capitato','hamate':'hamato','navicular':'navicular',
    'cuboid':'cuboide','sphenoid':'esfenoide','ethmoid':'etmoide','mandible':'mandíbula','vomer':'vômer',
    'concha':'concha','hyoid':'hioide','cuneiform':'cuneiforme','calcaneal':'calcâneo',
    'biceps':'bíceps','triceps':'tríceps','deltoid':'deltoide','trapezius':'trapézio','pectoralis':'peitoral',
    'rectus':'reto','serratus':'serrátil','gluteus':'glúteo','vastus':'vasto','quadratus':'quadrado',
    'gastrocnemius':'gastrocnêmio','soleus':'sóleo','plantaris':'plantar','popliteus':'poplíteo',
    'sartorius':'sartório','gracilis':'grácil','semitendinosus':'semitendíneo','semimembranosus':'semimembranáceo',
    'pectineus':'pectíneo','piriformis':'piriforme','supraspinatus':'supraespinal','infraspinatus':'infraespinal',
    'subscapularis':'subescapular','subclavius':'subclávio','brachialis':'braquial','anconeus':'ancôneo',
    'brachioradialis':'braquiorradial','supinator':'supinador','platysma':'platisma','mylohyoid':'milo-hióideo',
    'geniohyoid':'gênio-hióideo','vocalis':'vocal','genioglossus':'genioglosso','hyoglossus':'hioglosso',
    'scalenus':'escaleno','splenius':'esplênio','iliocostalis':'iliocostal','longissimus':'longuíssimo',
    'semispinalis':'semiespinal','spinalis':'espinal','interspinalis':'interespinal','interspinales':'interespinais',
    'intertransversarius':'intertransversário','intertransversarii':'intertransversários','levatores':'levantadores',
    'teres':'redondo','rhomboid':'romboide','digastric':'digástrico','gemellus':'gêmeo','coccygeus':'coccígeo',
    'pubococcygeus':'pubococcígeo','puborectalis':'puborretal','iliococcygeus':'iliococcígeo',
    'aryepiglotticus':'ariepiglótico','stylopharyngeus':'estilofaríngeo','salpingopharyngeus':'salpingofaríngeo',
    'palatopharyngeus':'palatofaríngeo','sternocleidomastoid':'esternocleidomastoideo','coracobrachialis':'coracobraquial',
    'iliacus':'ilíaco','psoas':'psoas','iliopsoas':'iliopsoas','obliquus':'oblíquo','transversus':'transverso',
    'straight':'reto','iliotibial':'iliotibial','thenar':'tenar','hypothenar':'hipotenar','scalene':'escaleno',
    'cardinal':'cardinal','mammillary':'mamilar','pineal':'pineal','pituitary':'hipofisário','epithalamus':'epitálamo',
    'putamen':'putâmen','pallidus':'pálido','amygdala':'amígdala','hippocampus':'hipocampo',
    'corona':'coroa','callosum':'caloso','splenial':'esplenial','pre':'pré','extra':'extra',
    'soft':'mole','vertical':'vertical','subaortic':'subaórtico','curtain':'cortina','endocrine':'endócrino',
    'systemic':'sistêmico','caval':'caval','cavernous':'cavernoso','peritoneal':'peritoneal',
}

# Núcleos usados para melhorar a ordem de rótulos simples em que o inglês coloca
# vários modificadores antes do substantivo. Ex.: "left fifth metacarpal bone".
NUCLEOS: dict[str, tuple[str, str]] = {
    'artery': ('artéria', 'f'), 'arteries': ('artérias', 'f'),
    'vein': ('veia', 'f'), 'veins': ('veias', 'f'),
    'bone': ('osso', 'm'), 'muscle': ('músculo', 'm'), 'nerve': ('nervo', 'm'),
    'branch': ('ramo', 'm'), 'branches': ('ramos', 'm'), 'phalanx': ('falange', 'f'),
    'vertebra': ('vértebra', 'f'), 'rib': ('costela', 'f'), 'ligament': ('ligamento', 'm'),
    'cartilage': ('cartilagem', 'f'), 'gyrus': ('giro', 'm'), 'sulcus': ('sulco', 'm'),
    'lobe': ('lobo', 'm'), 'lobule': ('lóbulo', 'm'), 'duct': ('ducto', 'm'),
    'gland': ('glândula', 'f'), 'wall': ('parede', 'f'), 'layer': ('camada', 'f'),
    'segment': ('segmento', 'm'), 'part': ('parte', 'f'), 'division': ('divisão', 'f'),
    'subdivision': ('subdivisão', 'f'), 'valve': ('valva', 'f'), 'tooth': ('dente', 'm'),
    'ventricle': ('ventrículo', 'm'), 'atrium': ('átrio', 'm'), 'arch': ('arco', 'm'),
    'membrane': ('membrana', 'f'), 'tract': ('trato', 'm'), 'region': ('região', 'f'),
    'system': ('sistema', 'm'), 'organ': ('órgão', 'm'), 'disk': ('disco', 'm'),
    'cavity': ('cavidade', 'f'), 'capsule': ('cápsula', 'f'), 'fascia': ('fáscia', 'f'),
    'tendon': ('tendão', 'm'), 'foramen': ('forame', 'm'), 'fossa': ('fossa', 'f'),
    'tree': ('árvore', 'f'), 'leaflet': ('folheto', 'm'), 'cusp': ('cúspide', 'f'),
    'commissure': ('comissura', 'f'), 'head': ('cabeça', 'f'), 'skeleton': ('esqueleto', 'm'),
    'constrictor': ('constritor', 'm'), 'sphincter': ('esfíncter', 'm'), 'plexus': ('plexo', 'm'),
    'hemisphere': ('hemisfério', 'm'), 'column': ('coluna', 'f'), 'plate': ('placa', 'f'),
    'tooth': ('dente', 'm'), 'incisor': ('incisivo', 'm'), 'premolar': ('pré-molar', 'm'),
    'molar': ('molar', 'm'), 'canine': ('canino', 'm'), 'ganglion': ('gânglio', 'm'),
    'nucleus': ('núcleo', 'm'), 'peduncle': ('pedúnculo', 'm'), 'colliculus': ('colículo', 'm'),
}

# Ajustes básicos de gênero para qualificadores que aparecem com frequência.
FLEXAO_FEMININA: dict[str, str] = {
    'direito':'direita','esquerdo':'esquerda','médio':'média','interno':'interna','externo':'externa',
    'profundo':'profunda','pequeno':'pequena','grande':'grande','longo':'longa','curto':'curta',
    'próprio':'própria','secundário':'secundária','primário':'primária','acessório':'acessória',
    'ósseo':'óssea','torácico':'torácica','ilíaco':'ilíaca','hepático':'hepática','esplênico':'esplênica',
    'gástrico':'gástrica','cólico':'cólica','mesentérico':'mesentérica','pancreático':'pancreática',
    'cardíaco':'cardíaca','coronário':'coronária','aórtico':'aórtica','brônquico':'brônquica',
    'faríngeo':'faríngea','laríngeo':'laríngea','escapular':'escapular','umeral':'umeral',
    'poplíteo':'poplítea','frênico':'frênica','glúteo':'glútea','pélvico':'pélvica','epigástrico':'epigástrica',
    'circunflexo':'circunflexa','arqueado':'arqueada','coroideo':'coroidea','geniculado':'geniculada',
    'craniano':'craniana','autônomo':'autônoma','púbico':'púbica','fibular':'fibular',
    'cárpico':'cárpica','társico':'társica','típico':'típica','atípico':'atípica',
    'plano':'plana','oco':'oca','sólido':'sólida','cavitado':'cavitada','membranoso':'membranosa',
}

LATIM_OU_EPONIMOS_PERMITIDOS = {
    # Termos latinos/propriamente nominais que podem sobreviver apenas quando não
    # há forma lexical separada; a maior parte é convertida nas tabelas acima.
    'alba','lata','linea','mons','pubis','cinereum','spongiosum','cavernosum',
    'terminalis','medullaris','ciliaris','corpus','brachium','dorsum','raphe',
    'taenia','princeps','vivo','libera','mesocolica','elasticus','accessorius',
}


def _preservar_caixa(origem: str, traducao: str) -> str:
    """Aplica inicial maiúscula quando o rótulo original começava em maiúscula."""
    if origem and origem[0].isupper() and traducao:
        return traducao[0].upper() + traducao[1:]
    return traducao


def _traduzir_token(token: str) -> str:
    """Traduz um token isolado sem alterar pontuação externa."""
    minusculo = token.lower()
    return PALAVRAS.get(minusculo, token)


def _aplicar_frases(texto: str) -> str:
    """Substitui expressões multi-palavra antes da etapa lexical."""
    resultado = texto
    for ingles, portugues in sorted(FRASES.items(), key=lambda item: len(item[0]), reverse=True):
        resultado = re.sub(rf'(?<!\w){re.escape(ingles)}(?!\w)', portugues, resultado, flags=re.IGNORECASE)
    return resultado


def _preposicao_de(termo: str) -> str:
    """Escolhe de/do/da/dos/das pelo primeiro substantivo traduzido."""
    primeiro = termo.strip().split(' ', 1)[0].lower() if termo.strip() else ''
    femininos = {'artéria','veia','falange','vértebra','costela','cartilagem','glândula','parede','camada','parte','divisão','subdivisão','valva','membrana','região','cavidade','cápsula','fáscia','fossa','mão','cabeça','boca','língua','pele','medula','escápula','tíbia','fíbula','patela','pelve','aorta','uretra','próstata'}
    femininos_plural = {'artérias','veias','vértebras','costelas','glândulas','regiões','partes'}
    masculinos_plural = {'ramos','ossos','nervos','músculos','dedos','pulmões','órgãos','segmentos'}
    sem_artigo = {'lado'}
    if primeiro in femininos: return 'da'
    if primeiro in femininos_plural: return 'das'
    if primeiro in masculinos_plural: return 'dos'
    if primeiro in sem_artigo: return 'do'
    return 'do' if primeiro else 'de'


def _traduzir_segmento_simples(segmento: str) -> str:
    """Traduz um trecho sem vírgulas; melhora a ordem quando há núcleo conhecido."""
    s = segmento.strip()
    if not s:
        return s

    exata = EXATAS.get(s.lower())
    if exata:
        return _preservar_caixa(s, exata)

    # A relação "X of Y" é tratada de forma recursiva para manter a leitura
    # natural em português: "branch of ..." -> "ramo de ...".
    partes_of = re.split(r'\s+of\s+', s, maxsplit=1, flags=re.IGNORECASE)
    if len(partes_of) == 2:
        esquerda = _traduzir_segmento_simples(partes_of[0])
        direita = _traduzir_segmento_simples(partes_of[1])
        prep = _preposicao_de(direita)
        return f'{esquerda} {prep} {direita}'

    # Relações vasculares como "branch ... to ..." precisam ser divididas antes
    # da regra de núcleo; caso contrário, o substantivo final distorce a ordem.
    partes_to = re.split(r'\s+to\s+', s, maxsplit=1, flags=re.IGNORECASE)
    if len(partes_to) == 2:
        esquerda = _traduzir_segmento_simples(partes_to[0])
        direita = _traduzir_segmento_simples(partes_to[1])
        return f'{esquerda} para {direita}'

    # Identifica prefixo de lateralidade e o move para o fim. "do lado" evita
    # problemas de concordância em nomes muito compostos.
    lado = None
    m_lado = re.match(r'^(left|right)\s+(.+)$', s, flags=re.IGNORECASE)
    if m_lado:
        lado = 'esquerdo' if m_lado.group(1).lower() == 'left' else 'direito'
        s = m_lado.group(2)

    # A regra de núcleo precisa trabalhar com o inglês original antes das
    # substituições de expressões. Assim, "posterior segmental artery" vira
    # "artéria segmentar posterior", e não "posterior artéria segmentar".
    palavras_orig = re.findall(r"[A-Za-z]+", s.lower())
    nucleo_original = palavras_orig[-1] if palavras_orig else ''
    nucleo = NUCLEOS.get(nucleo_original)

    if nucleo and s.lower() not in EXATAS:
        indice = s.lower().rfind(nucleo_original)
        modificadores_orig = s[:indice].strip()

        # Para músculos, usa primeiro a expressão consagrada quando disponível.
        # Ex.: flexor pollicis longus -> flexor longo do polegar.
        if nucleo_original == 'muscle' and modificadores_orig.lower() in FRASES:
            mods_texto = FRASES[modificadores_orig.lower()]
            resultado = f'{nucleo[0]} {mods_texto}'.strip()
        else:
            # Se o conjunto de modificadores possui uma tradução exata/frase, ela
            # já está na ordem anatômica portuguesa; caso contrário, invertemos os
            # qualificadores, padrão frequente do inglês -> português.
            if modificadores_orig.lower() in FRASES:
                mods = FRASES[modificadores_orig.lower()].split()
            elif modificadores_orig.lower() in EXATAS:
                mods = EXATAS[modificadores_orig.lower()].split()
            else:
                mods = [_traduzir_token(t) for t in re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]+|\d+º|[IVX]+", modificadores_orig)]
                mods = [m for m in mods if m]
                mods = list(reversed(mods))

            if nucleo[1] == 'f':
                mods = [FLEXAO_FEMININA.get(m, m) for m in mods]
                mods = [re.sub(r'^(\d+)º$', r'\1ª', m) for m in mods]
            resultado = ' '.join([nucleo[0], *mods]).strip()
    else:
        # Sem núcleo no fim, ainda aplicamos expressões e depois o léxico.
        s_localizado = _aplicar_frases(s)
        tokens = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]+(?:'[A-Za-zÀ-ÖØ-öø-ÿ]+)?|\d+º|[IVX]+|[^\w\s]+", s_localizado)
        resultado = ' '.join(_traduzir_token(t) if re.match(r'^[A-Za-zÀ-ÖØ-öø-ÿ]', t) else t for t in tokens)
        resultado = re.sub(r'\s+([,;:)])', r'\1', resultado)
        resultado = re.sub(r'([(])\s+', r'\1', resultado)
        resultado = re.sub(r'\s+', ' ', resultado).strip()

    if lado:
        resultado = f'{resultado} do lado {lado}'

    return _preservar_caixa(segmento.strip(), resultado)


def traduzir_nome(nome: str) -> str:
    """Traduz um rótulo anatômico completo para português do Brasil.

    A função é determinística e não chama serviços externos. Assim, o resultado
    gerado no build é reprodutível e auditável.
    """
    if not nome or not nome.strip():
        return nome

    exata = EXATAS.get(nome.strip().lower())
    if exata:
        return _preservar_caixa(nome.strip(), exata)

    # Vírgulas normalmente separam qualificadores como "inner layer".
    segmentos = [seg.strip() for seg in nome.split(',')]
    traduzidos = [_traduzir_segmento_simples(seg) for seg in segmentos]
    resultado = ', '.join(traduzidos)
    resultado = re.sub(r'\s+', ' ', resultado).strip()

    # Ajustes terminológicos e tipográficos finais. São aplicados no resultado
    # localizado, sem tocar no nome original armazenado em `nameEn`.
    resultado = re.sub(r'(?i)\bosso metacarpal\b', 'metacarpo', resultado)
    resultado = re.sub(r'(?i)\bosso metatarsal\b', 'metatarso', resultado)
    resultado = resultado.replace('pré - central', 'pré-central').replace('pós - central', 'pós-central')
    resultado = resultado.replace('crico - aritenoide', 'cricoaritenoideo')
    resultado = resultado.replace('infra - ', 'infra-').replace('supra - ', 'supra-')
    return resultado


# Vocabulário inglês usado pela validação para detectar vazamento de rótulos.
# Em vez de exigir que toda palavra seja portuguesa (há nomes latinos e próprios),
# verificamos termos inequivocamente ingleses da fonte.
INGLES_NAO_PERMITIDO = {
    termo
    for termo, traducao in PALAVRAS.items()
    if re.fullmatch(r'[a-z]+', termo)
    and termo != re.sub(r'[^a-z]', '', traducao.lower())
    and termo not in {'anterior','posterior','superior','inferior','lateral','medial','central','digital','dorsal','palmar','plantar','basal','apical','distal','proximal','cerebral','temporal','frontal','parietal','occipital','radial','ulnar','femoral','tibial','renal','portal','lumbar','cervical','sacral','costal','nasal','vocal','orbital','anal','caudal','median','sigmoid','facial','variant'}
}



def palavras_inglesas_remanescentes(texto: str) -> list[str]:
    """Retorna palavras inglesas proibidas ainda presentes em um rótulo traduzido."""
    tokens = {t.lower() for t in re.findall(r"[^\W\d_]+", texto, flags=re.UNICODE)}
    return sorted(tokens & INGLES_NAO_PERMITIDO)
