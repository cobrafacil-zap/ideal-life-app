#!/usr/bin/env python3
"""
VITTA — Instruções de execução por exercício.

O catálogo global tem `instructions` vazio em 84 dos 106 exercícios, e o
detalhe do exercício mostra esse bloco logo depois das séries/reps. Aqui
fica o texto de cada movimento, em pt-BR, com passos concretos e cues de
execução (amplitude, respiração, coluna, joelho).

Uso:
    python3 scripts/populate_instructions.py            # gera a migration
    python3 scripts/populate_instructions.py --apply    # gera e aplica
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

INSTRUCTIONS: dict[str, str] = {
    # ── Abdômen / core ──
    "Abdominal bicicleta": (
        "Deitado de costas, joelhos a 90° e quadril levemente elevado. "
        "Estenda uma perna enquanto gira o tronco e alcance o cotovelo "
        "oposto, alternando os lados. Mantenha a lombar apoiada no chão e "
        "o abdômen contraído; expire a cada rotação."
    ),
    "Abdominal canivete": (
        "Deitado de costas, braços estendidos acima da cabeça e pernas "
        "juntas e estendidas. Erga simultaneamente os braços e as pernas, "
        "curvando o tronco, e desça lentamente. O movimento é contínuo, "
        "sem impulso, e a lombar não sai do chão."
    ),
    "Abdominal crunch": (
        "Deitado de costas, joelhos fletidos e pés apoiados no chão. "
        "Eleve o tronco até os ombros saírem do piso, contraindo o "
        "abdômen, e volte devagar sem relaxar a lombar."
    ),
    "Abdominal na roda": (
        "Deitado de costas, pernas estendidas e braços ao lado do corpo. "
        "Erga as pernas até a vertical, girando o quadril, e desça "
        "controlando. O abdômen permanece contraído durante todo o "
        "movimento e a nuca permanece apoiada."
    ),
    "Abdominal supra": (
        "Deitada de costas, joelhos fletidos e pés no chão. Expire e eleve "
        "o tronco até a parte superior das costas sair do piso. Desça sem "
        "bater as costas no chão e mantenha a lombar neutra."
    ),
    "Dead bug": (
        "Deitado de costas, braços estendidos acima do peito e joelhos "
        "fletidos a 90°. Estenda um braço e a perna opostos, mantendo a "
        "lombar colada no chão, e volte à posição inicial trocando os "
        "lados. O abdômen não pode arquear a coluna."
    ),
    "Prancha": (
        "Apoie-se nos antebraços e nas pontas dos pés, com o corpo em linha "
        "reta da cabeça ao calcanhar. Contraia abdômen e glúteos, puxe o "
        "umbigo para dentro e não deixe o quadril cair. Respire de forma "
        "contínua, sem prender o ar."
    ),
    "Prancha lateral": (
        "Deite de lado, apoiando o antebraço no chão e empilhando os pés. "
        "Eleve o quadril até o corpo formar uma linha reta, contraindo o "
        "abdômen lateral. Mantenha o quadril alto e respire normalmente."
    ),
    "Russian twist": (
        "Sente com os joelhos fletidos e o tronco levemente inclinado para "
        "trás. Com o haltere nas mãos à frente do peito, gire o tronco para "
        "um lado e para o outro, movendo o peso com o abdômen — não só os "
        "braços."
    ),
    # ── Quadril / abdutores ──
    "Abdução de quadril": (
        "Sente-se na máquina com as coxas apoiadas e os joelhos levemente "
        "flexionados. Abra as pernas contra a resistência até a amplitude "
        "confortável e volte devagar, sem deixar o quadrilbalançar."
    ),
    "Abdução de quadril com elástico": (
        "Fique em pé com o elástico acima dos joelhos. Abra as pernas "
        "contra a tensão, contraindo o quadril lateral, e retorne "
        "controlando. O tronco permanece ereto e a pelve não gira."
    ),
    "Cadeira abdutora": (
        "Ajuste o assento para que os joelhos fiquem levemente flexionados "
        "e as coxas travadas no aparelho. Separe as pernas até a amplitude "
        "confortável e volte sem solavanco. Não compense com o tronco."
    ),
    "Cadeira adutora": (
        "Sente-se com as coxas apoiadas e as pernas separadas. Feche as "
        "pernas contra a resistência até quase encostar e retorne "
        "devagar, mantendo o quadril apoiado no encosto."
    ),
    # ── Pernas / glúteos ──
    "Afundo búlgaro": (
        "Fique em pé com o pé da frente a um passo da caixa e o de trás "
        "apoiado sobre ela. Desça o joelho da frente até 90°, mantendo o "
        "tronco ereto, e volte empurrando o chão. O joelho não ultrapassa "
        "a linha dos dedos do pé."
    ),
    "Afundo com halteres": (
        "Segure um haltere em cada mão ao lado do corpo. Dê um passo à "
        "frente, desça o joelho de trás até 90° e volte à posição inicial. "
        "O tronco fica vertical e o peso distribuído entre os dois pés."
    ),
    "Agachamento búlgaro com halteres": (
        "Com o pé de trás elevado, desça o quadril até a coxa parallel ao "
        "chão, com o joelho da frente alinhado ao pé. Suba devagar. "
        "Mantenha o tronco inclinado levemente à frente e o peso no pé da "
        "frente."
    ),
    "Agachamento com elástico": (
        "Pise no centro do elástico e segure as pontas na altura dos "
        "ombros. Agache até as coxas ficarem paralelas ao chão, pressionando "
        "o elástico para fora, e volte devagar."
    ),
    "Agachamento com halteres": (
        "Com um haltere em cada mão ao lado do corpo, agache até as coxas "
        "ficarem paralelas ao chão. Mantenha os joelhos na direção dos "
        "pés, o peito erguido e o olhar à frente. Suba empurrando o chão."
    ),
    "Agachamento com kettlebell": (
        "Segure o kettlebell junto ao peito, com os cotovelos próximos ao "
        "corpo. Agache até as coxas ficarem paralelas ao chão, mantendo a "
        "coluna neutra, e volte empurrando o chão."
    ),
    "Agachamento livre": (
        "Posicione a barra sobre o trapézio, com as mãos mais largas que "
        "os ombros. Agache até as coxas ficarem paralelas ao chão, joelhos "
        "na direção dos pés, e volte sem perder a posição da barra."
    ),
    "Agachamento no hack": (
        "Ajuste o apoio dos ombros e posicione os pés na largura dos ombros. "
        "Agache até a profundidade confortável, mantendo as costas coladas "
        "ao encosto e os joelhos alinhados aos pés."
    ),
    "Agachamento no smith": (
        "Posicione a barra na linha dos trapézios e destrave o aparelho. "
        "Agache até as coxas ficarem paralelas ao chão e volte. A barra "
        "desce em linha reta, sem desviar para a frente."
    ),
    "Agachamento smith sumô": (
        "Coloque os pés bem afastados e a barra na linha dos trapézios. "
        "Agache mantendo os joelhos apontando para fora, na mesma direção "
        "dos pés, e volte devagar."
    ),
    "Agachamento sumô": (
        "Abra os pés mais que a largura dos ombros e segure a barra na "
        "linha dos trapézios. Agache com os joelhos abertos na direção dos "
        "pés e o tronco ereto; na volta, empurre o chão com os pés."
    ),
    "Avanço": (
        "Dê um passo longo à frente e desça até os dois joelhos ficarem a "
        "90°. O joelho da frente não ultrapassa o pé. Volte à posição "
        "inicial com controle e sem perder o equilíbrio."
    ),
    "Bom dia": (
        "Com a barra na linha dos ombros, flexione o quadril empurrando a "
        "barra para trás, com as pernas quase estendidas e a coluna neutra. "
        "Volte sem hiperestender a lombar."
    ),
    "Cadeira extensora": (
        "Sente-se com o joelho alinhado ao eixo da máquina. Estenda as "
        "pernas até a contração do quadríceps e desça lentamente até a "
        "flexão completa, sem swing."
    ),
    "Coice com elástico": (
        "Ajoelhe-se ou apoie-se em uma perna, com o elástico preso atrás "
        "do joelho. Estenda a coxa para trás contra a tensão, contraindo o "
        "glúteo, e volte sem girar o quadril."
    ),
    "Elevação pélvica": (
        "Deitado de costas, joelhos fletidos e pés no chão. Eleve o "
        "quadril até o corpo formar uma linha reta dos ombros aos joelhos, "
        "contraindo os glúteos, e desça devagar."
    ),
    "Extensão de quadril no cabo": (
        "Prenda o cabo ao tornozelo e mantenha o tronco firme. Leve a perna "
        "para trás contraindo o glúteo, sem arquear a lombar, e volte "
        "controlando."
    ),
    "Flexora em pé": (
        "Fique em pé na máquina com o tornozelo preso ao apoio. Flexione o "
        "joelho bringing o calcanhar em direção ao glúteo e volte devagar, "
        "sem deixar o peso cair no pé livre."
    ),
    "Flexora em pé unilateral": (
        "Com uma perna na máquina e a outra livre, flexione o joelho "
        "levando o calcanhar ao glúteo. Contraia o posterior da coxa e "
        "volte de forma controlada, sem balancear o quadril."
    ),
    "Glúteo na máquina": (
        "Encoste o quadril no apoio e posicione os pés na plataforma. "
        "Empurre o quadril para trás contraindo os glúteos até a extensão "
        "do quadril, e volte sem deixar o peso cair no quadril."
    ),
    "Hack squat": (
        "Posicione os ombros no apoio e os pés na plataforma, na largura "
        "dos ombros. Desça até a amplitude confortável, mantendo as costas "
        "coladas ao encosto, e volte empurrando a plataforma."
    ),
    "Hip thrust": (
        "Sente-se com as costas apoiadas na bancada e a barra sobre o "
        "quadril. Empurre o quadril até a extensão, contraindo os glúteos, "
        "sem hiperestender a lombar, e desça controlando."
    ),
    "Leg press 45": (
        "Costas e cabeça apoiadas na bancada, pés na plataforma na largura "
        "dos ombros. Flexione os joelhos aproximando o peito, sem colar o "
        "quadril, e estenda as pernas sem travar os joelhos."
    ),
    "Leg press 45 unilateral": (
        "Com uma perna na plataforma e a outra livre, flexione o joelho "
        "levando o quadril ao peito. Empurre de volta até quase estender, "
        "sem travar o joelho, e mantenha o quadril apoiado."
    ),
    "Levantamento terra": (
        "Com a barra sobre a linha dos pés, flexione o quadril e o joelho, "
        "mantendo as costas retas. Puxe a barra subindo com o quadril e "
        "estenda joelhos e quadril juntos; desça sob controle."
    ),
    "Levantamento terra com halteres": (
        "Segure um haltere em cada mão ao lado do corpo. Com a coluna "
        "neutra, empurre o chão e estenda o quadril, subindo os halteres "
        " junto do corpo. Volte devagar sem arredondar a lombar."
    ),
    "Mesa flexora": (
        "Deite no apoio com os tornozelos presos ao rolo. Flexione os "
        "joelhos bringing os calcanhares em direção aos glúteos e volte "
        "lentamente, sem levantar o quadril."
    ),
    "Mesa flexora unilateral": (
        "Com uma perna livre, flexione o joelho da perna presa até a "
        "contração máxima do posterior. Volte devagar e repita; o quadril "
        "permanece apoiado o tempo todo."
    ),
    "Panturrilha em pé": (
        "Fique em pé com a ponta dos pés na plataforma e o restante do pé "
        "livre. Eleve os calcanhares o máximo possível, faça uma pausa "
        "breve no topo e desça até sentir o alongamento."
    ),
    "Panturrilha no leg press": (
        "Com os pés posicionados na parte alta da plataforma, empurre a "
        "plataforma com as pontas dos pés até estender os joelhos. Não "
        "trave os joelhos e mantenha a ponta dos pés apoiada."
    ),
    "Panturrilha sentada": (
        "Sente-se com a parte inferior das pernas apoiadas e os calcanhares "
        "livres. Eleve os calcanhares até a máxima contração, pause e "
        "desça lentamente até o alongamento."
    ),
    "Ponte de glúteo com barra": (
        "Deite com os joelhos fletidos e a barra sobre o quadril. "
        "Contraia os glúteos e empurre o quadril para cima até o corpo "
        "formar uma linha reta. Evite arquear a lombar no topo."
    ),
    "Ponte de glúteo com halteres": (
        "Deite de costas, joelhos fletidos e um haltere sobre o quadril. "
        "Erga o quadril contraindo os glúteos até alinhar ombros, quadril e "
        "joelhos, e desça devagar."
    ),
    "Sissy squat": (
        "Fique em pé com os pés na plataforma e o corpo ereto. Desça o "
        "quadril para trás como se sentasse, joelhos à frente, e volte. "
        "O tronco permanece vertical durante todo o movimento."
    ),
    "Step up com halteres": (
        "Suba o degrau com um haltere em cada mão, conduzindo o joelho até "
        "estender a perna de cima. Desça controlando até o chão. O joelho "
        "não deve ultrapassar a ponta do pé."
    ),
    "Stiff": (
        "Com a barra na linha dos quadris, flexione o quadril empurrando "
        "a barra para trás e mantenha as pernas quase estendidas. Volte "
        "sentindo o alongamento nos posteriores, com a coluna neutra."
    ),
    "Stiff com halteres": (
        "Segure os halteres à frente do corpo. Flexione o quadril como "
        "num deadlift, com as pernas quase estendidas e as costas retas. "
        "Suba contraindo os glúteos e a linha superior das costas."
    ),
    "Stiff com kettlebell": (
        "Segure o kettlebell com as duas mãos à frente do corpo. Desça "
        "empurrando o quadril para trás, com as pernas quase estendidas, e "
        "volte contraindo os glúteos."
    ),
    # ── Costas ──
    "Barra fixa": (
        "Segure a barra com as mãos afastadas na largura dos ombros e "
        "pendure com os braços estendidos. Puxe o queixo em direção à barra "
        "levando os ombros para baixo; desça até estender os braços."
    ),
    "Face pull": (
        "Puxe o cabo em direção ao rosto, abrindo os cotovelos para os "
        "lados. Termine com os punhos acima dos ombros e os ombros "
        "afastados. Não puxe o cabo para baixo."
    ),
    "Hiperextensão": (
        "Fique em apoio no quadril com os pés travados. Curve o tronco "
        "para frente até formar uma linha reta com as coxas e volte "
        "contraindo os glúteos, sem ultrapassar a linha do corpo."
    ),
    "Pulldown com corda": (
        "Sente-se com a coxa presa. Puxe a corda em direção ao peito, "
        "levando os cotovelos para baixo e para trás, e controle a volta "
        "até os braços estendidos."
    ),
    "Puxada frontal": (
        "Sente-se com as coxas travadas e incline o tronco levemente para "
        "trás. Puxe a barra em direção ao peito superior, com os cotovelos "
        "indo para baixo; volte devagar."
    ),
    "Puxada frontal pegada supinada": (
        "Sente-se com as coxas travadas, com as mãos em pegada supinada. "
        "Puxe a barra em direção ao peito baixo, aproximando os ombros "
        "para trás, e volte sem balançar o tronco."
    ),
    "Remada alta": (
        "Segure a barra na linha do quadril e puxe em direção ao abdômen, "
        "elevando os cotovelos. A coluna permanece neutra e o quadril não "
        "manda para trás."
    ),
    "Remada baixa no cabo": (
        "Sente-se com os pés na plataforma. Puxe o cabo em direção ao "
        "abdômen, mantendo o tronco ereto e os cotovelos colados ao corpo; "
        "controle a volta até a extensão dos braços."
    ),
    "Remada cavalinho": (
        "Deite sobre o banco, com a barra presa e os pés apoiados. Puxe a "
        "barra em direção ao peito, guiando com os cotovelos, e volte até "
        "estender os braços."
    ),
    "Remada curvada": (
        "Incline o tronco a 45° com as pernas apoiadas e a barra pendurada. "
        "Puxe a barra em direção ao abdômen, contraindo as costas, e "
        "desça controlando."
    ),
    "Remada unilateral": (
        "Com um haltere em uma mão, apoie a outra no joelho e incline o "
        "tronco. Puxe o haltere em direção ao quadril, contraindo as "
        "costas, e desça devagar."
    ),
    "Remo ergométrico": (
        "Sente-se com os pés na plataforma. Empurre as pernas, incline o "
        "tronco e puxe a barra em direção ao abdômen; na volta, estenda os "
        "braços antes de flexionar os joelhos."
    ),
    # ── Peito ──
    "Crossover": (
        "Em pé entre as polias, segure as alças e leve os braços juntos à "
        "frente, fletindo levemente os cotovelos. Volte abrindo os braços "
        "de forma controlada, mantendo o tronco levemente inclinado."
    ),
    "Crucifixo inclinado": (
        "Deite em um banco inclinado com um haltere em cada mão. Abra os "
        "braços em arco, com os cotovelos levemente flexionados, e volte "
        "até a posição inicial sem cruzar as mãos."
    ),
    "Crucifixo reto": (
        "Deite em um banco plano, com um haltere em cada mão acima do "
        "peito. Abra os braços em arco até os halteres ficarem na linha do "
        "peito e volte controlando."
    ),
    "Flexão de braço": (
        "Apoie as mãos no chão à largura dos ombros e o corpo em linha "
        "reta. Flexione os cotovelos a 45° do tronco, até o peito perto do "
        "chão, e empurre o corpo para cima sem perder o alinhamento."
    ),
    "Flexão declinada": (
        "Com os pés elevados e as mãos no chão, mantenha o corpo em linha "
        "reta. Flexione os cotovelos até o peito aproximar-se do chão e "
        "empurre para cima, controlando a descida."
    ),
    "Mergulho": (
        "Segure as barras paralelas e flexione os joelhos até os ombros "
        "ficarem na linha dos cotovelos. Empurre o corpo para cima "
        "estendendo os cotovelos, sem bater as mãos no chão."
    ),
    "Peck deck": (
        "Sente-se com os braços alinhados com as alças do aparelho. Feche "
        "os braços contra a resistência, contraindo o peito, e abra "
        "controlando o retorno."
    ),
    "Supino declinado": (
        "Deite em um banco declinado com a barra sobre o peito. Retire a "
        "barra do suporte, desça até a linha do peito e empurre para cima "
        "sem perder a estabilidade da base das mãos."
    ),
    "Supino inclinado com barra": (
        "Deite em um banco inclinado com a barra sobre o trapézio. "
        "Desça a barra até a linha do peito e empurre para cima, mantendo "
        "as escápulas apoiadas no banco."
    ),
    "Supino inclinado com halteres": (
        "Sente-se no banco inclinado com um haltere em cada mão ao lado do "
        "ombro. Empurre os halteres para cima e desça até a linha do "
        "ombro, com os cotovelos levemente flexionados."
    ),
    "Supino reto com barra": (
        "Deite no banco plano com a barra acima do peito e as mãos um "
        "pouco mais largas que os ombros. Desça a barra até a linha do "
        "peito e empurre para cima sem tirar as escápulas do banco."
    ),
    "Supino reto com halteres": (
        "Deite no banco com um haltere em cada mão na linha do peito. "
        "Empurre os halteres para cima e desça até a linha do peito, "
        "mantendo os cotovelos levemente flexionados."
    ),
    # ── Ombros ──
    "Crucifixo inverso": (
        "Incline o tronco à frente com um haltere em cada mão. Abra os "
        "braços em arco até a linha do tronco, contraindo a parte de trás "
        "dos ombros, e volte controlando."
    ),
    "Crucifixo inverso na máquina": (
        "Sente-se de frente para a máquina e segure as alças. Abra os "
        "braços em arco, resistindo com a parte de trás dos ombros, e "
        "volte sem soltar a tensão."
    ),
    "Desenvolvimento com barra": (
        "Segure a barra na linha do peito, com as mãos afastadas. Empurre "
        "a barra para cima até a extensão dos braços, sem hiperestender o "
        "joelho, e desça controlando."
    ),
    "Desenvolvimento com halteres": (
        "Sente-se com um haltere em cada mão na altura dos ombros. "
        "Empurre os halteres para cima e desça até a linha dos ombros, sem "
        "bater os halteres um no outro."
    ),
    "Desenvolvimento máquina": (
        "Ajuste o assento para que os punhos fiquem na altura dos ombros. "
        "Empurre os punhos para cima até estender os braços e volte até a "
        "altura inicial, controlando."
    ),
    "Elevação frontal": (
        "Segure um haltere em cada mão à frente das coxas. Eleve os "
        "halteres até a altura dos ombros, com os cotovelos levemente "
        "flexionados, e desça lentamente."
    ),
    "Elevação frontal com barra": (
        "Segure a barra à frente das coxas, com as palmas voltadas para "
        "trás. Eleve a barra até a altura dos ombros e desça de forma "
        "controlada, sem impulsionar o quadril."
    ),
    "Elevação lateral": (
        "Com um haltere em cada mão, eleve os braços lateralmente até a "
        "altura dos ombros. O cotovelo permanece levemente flexionado e "
        "abaixo da linha do punho. Desça sem chutar o ombro."
    ),
    "Elevação lateral unilateral no cabo": (
        "Puxe a alça do cabo lateralmente, com o braço na altura do ombro, "
        "até a linha do tronco. Desça controlando e mantenha o tronco "
        "estável."
    ),
    "Encolhimento": (
        "Com a barra ou os halteres na frente das coxas, eleve os ombros "
        "em direção às orelhas, contraindo o trapézio. Pausa breve no "
        "topo e descida lenta."
    ),
    # ── Braços ──
    "Rosca alternada": (
        "Com um haltere em cada mão, flexione um cotovelo por vez até o "
        "haltere perto do ombro, com o cotovelo junto ao corpo. Desça "
        "controlando antes de subir o outro braço."
    ),
    "Rosca concentrada": (
        "Apoie o cotovelo na coxa e segure o haltere com a mão voltada "
        "para cima. Flexione o cotovelo até o haltere perto do ombro e "
        "desça lentamente, mantendo o ombro fixo."
    ),
    "Rosca direta": (
        "Segure a barra com as palmas voltadas para cima, à largura dos "
        "ombros. Flexione os cotovelos levando a barra em direção ao peito, "
        "sem mover o tronco, e desça controlando."
    ),
    "Rosca inversa": (
        "Segure a barra com as palmas voltadas para baixo (pegada "
        "pronada). Flexione os cotovelos e baixe a barra para frente do "
        "corpo, controlando a volta."
    ),
    "Rosca martelo": (
        "Segure os halteres com as palmas voltadas para dentro, como se "
        "segurasse um martelo. Flexione os cotovelos e desça mantendo o "
        "punho alinhado com o antebraço."
    ),
    "Rosca no cabo": (
        "Em pé, segure a alça do cabo com as palmas voltadas para cima. "
        "Flexione o cotovelo levando a alça em direção ao ombro, com o "
        "cotovelo junto ao corpo, e desça controlando."
    ),
    "Rosca scott": (
        "Sente-se no banco preacher com as costas apoiadas e os braços no "
        "apoio. Flexione os cotovelos mantendo os úmeros verticais, até os "
        "halteres na altura dos ombros."
    ),
    "Supino fechado": (
        "Deite no banco com a barra e as mãos mais estreitas que os "
        "ombros. Desça a barra até tocar o peito, com os cotovelos mais "
        "dobrados, e empurre para cima."
    ),
    "Tríceps coice": (
        "Ajoelhe-se ou incline o tronco com um haltere em uma mão. Estenda "
        "o cotovelo levando o haltere para trás, contraindo o tríceps, e "
        "volte com o cotovelo fixo."
    ),
    "Tríceps francês": (
        "Deite no banco com um haltere em cada mão e os braços "
        "verticalmente. Flexione os cotovelos, abaixando os halteres em "
        "direção à cabeça, e estenda de volta."
    ),
    "Tríceps na polia": (
        "Prenda a corda à polia baixa e segure com as mãos na altura do "
        "peito. Estenda os cotovelos para baixo, contraindo o tríceps, e "
        "volte até a linha dos antebraços."
    ),
    "Tríceps testa": (
        "Deite no banco com a barra e as mãos na largura dos ombros. "
        "Desça a barra em direção à testa, com os cotovelos apontando "
        "para a frente, e estenda os braços."
    ),
    "Elevação de pernas": (
        "Deitado de costas, com as pernas estendidas e os braços ao lado do "
        "corpo. Erga as pernas até a vertical, girando o quadril, e desça "
        "controlando sem deixar a lombar arquear."
    ),
    "Swing de kettlebell": (
        "Segure o kettlebell com as duas mãos e flexione o quadril, "
        "levando-o entre as pernas. Contraia os glúteos e empurre o "
        "quadril para frente, subindo o kettlebell até a altura do peito "
        "com os braços estendidos. O movimento vem do quadril, não dos "
        "braços."
    ),
    # ── Cardio ──
    "Bicicleta ergométrica": (
        "Ajuste o banco de forma que o joelho fique levemente flexionado no "
        "ponto mais baixo. Pedale com ritmo constante e Mantenha o tronco "
        "fixo, sem balanço excessivo."
    ),
    "Caminhada": (
        "Caminhe em ritmo confortável, com passadas naturais e o tronco "
        "ereto. A respiração deve ser contínua e o olhar à frente."
    ),
    "Caminhada com elástico": (
        "Pise no elástico e Caminhe para frente mantendo a tensão constante. "
        "Os joelhos permanecem levemente flexionados e o tronco não gira."
    ),
    "Corrida": (
        "Aumente o ritmo de forma progressiva, com passadas curtas e "
        "cadência estável. O tronco permanece levemente inclinado à frente "
        "e a respiração acompanha o esforço."
    ),
    "Elíptico": (
        "Fique em pé nas plataformas e empurre com as pernas alternadas, "
        "mantendo o tronco ereto e os braços apoiados nos manípulos. O "
        "ritmo deve ser constante."
    ),
    "Esteira": (
        "Ajuste a inclinação e a velocidade no painel. Caminhe no centro da "
        "faixa, sem segurar os corrimões, e mantenha o ritmo constante."
    ),
    "Pular corda": (
        "Segure as pontas da corda com as mãos afastadas à largura dos "
        "ombros e gire apenas os pulsos. Use saltos pequenos, de baixo "
        "impacto, com aterrissagem suave na ponta dos pés."
    ),
}


def main() -> int:
    catalog = json.loads((ROOT / "scripts" / "exercise-catalog.json").read_text(encoding="utf-8"))
    names = [e["name"] for e in catalog]
    faltando = [n for n in names if n not in INSTRUCTIONS]
    sobrando = [n for n in INSTRUCTIONS if n not in names]
    print(f"Instruções escritas: {len(INSTRUCTIONS)}")
    if faltando:
        print(f"SEM INSTRUÇÃO ({len(faltando)}): {faltando}")
    if sobrando:
        print(f"FORA DO CATÁLOGO ({len(sobrando)}): {sobrando}")
    return 1 if faltando else 0


if __name__ == "__main__":
    raise SystemExit(main())
