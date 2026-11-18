/**
 * DOSSIERS — single source of truth for all four products.
 *
 * Every claim below is traceable to the actual source:
 *   cipher    → cipher-vault/src-tauri (aes-gcm, sha2, local-ip-address)
 *   eminence  → QuantAssistant/backend/quant_brain.py + quant_backtester.py
 *   epsilon   → project-dirac-delta/src (ai/, engine/, input/)
 *   fracture  → Project Mozzarela/game/src (world/, systems/, data/)
 *
 * Nothing here is invented. The operator's identity is never named.
 */

export const DOSSIERS = {
  cipher: {
    id: 'cipher',
    index: '01',
    slug: '/agent-cipher',
    name: 'Agent Cipher',
    display: 'CIPHER',
    accent: '#7cf5d5',
    classification: 'LOCAL-FIRST ENCLAVE',
    tagline: 'Your files never leave the machine unencrypted.',
    lede:
      'A desktop enclave that encrypts files with AES-256-GCM before they touch disk, ' +
      'then hands them to nobody. No account. No cloud bucket. No telemetry. ' +
      'When you want a file on another device, Cipher opens a one-shot drop on your ' +
      'local network and closes it the moment the transfer ends.',
    features: [
      {
        h: 'AES-256-GCM, sealed in Rust',
        b: 'Encryption runs in the Tauri core, not in the webview. Every volume gets a ' +
           'fresh nonce; the authentication tag is verified before a single plaintext ' +
           'byte is returned. Tampering fails loudly instead of decrypting to garbage.',
      },
      {
        h: 'The vault is a folder, not a service',
        b: 'Encrypted volumes live as ordinary files on your own disk. Back them up with ' +
           'Time Machine, drop them on a USB stick, delete them. There is no server ' +
           'holding a copy and no subscription that can strand your data.',
      },
      {
        h: 'WebDrop — LAN transfer, zero infrastructure',
        b: 'Cipher resolves your local IP and serves a single encrypted payload to a ' +
           'device on the same network. The link is address-scoped, ephemeral, and dies ' +
           'with the session. Nothing traverses the public internet.',
      },
      {
        h: 'SHA-256 integrity manifest',
        b: 'Each volume carries a digest recorded at seal time. The enclave re-checks it ' +
           'on every open, so silent corruption on a failing drive surfaces as an error ' +
           'rather than a file that quietly stopped being itself.',
      },
      {
        h: 'A decryption console you can read',
        b: 'Unsealing is not a spinner. The terminal reports each stage — load, integrity ' +
           'verify, key availability, unseal — so you always know which step failed and why.',
      },
    ],
    specs: [
      ['Cipher', 'AES-256-GCM (authenticated)'],
      ['Digest', 'SHA-256 per volume'],
      ['Core', 'Rust — Tauri 2'],
      ['Interface', 'React 19'],
      ['Transport', 'LAN WebDrop, address-scoped'],
      ['Network', 'None required — fully offline capable'],
      ['Platform', 'macOS · Apple Silicon'],
    ],
    glance: [
      { k: 'DASHBOARD', v: 'Volume roster, seal state, capacity at a glance' },
      { k: 'ENCLAVE', v: 'Per-file decryption console with staged output' },
      { k: 'WEBDROP', v: 'Broadcast panel — address, lifetime, kill switch' },
    ],
    download: {
      file: '/downloads/AgentCipher-1.0.0-mac.zip',
      label: 'AgentCipher-1.0.0-mac.zip',
      version: '1.0.0',
      size: '5.0 MB',
      target: 'macOS · Apple Silicon',
    },
  },

  eminence: {
    id: 'eminence',
    index: '02',
    slug: '/agent-eminence',
    name: 'Agent Eminence',
    display: 'EMINENCE',
    accent: '#e5b451',
    classification: 'QUANTITATIVE ENSEMBLE',
    tagline: 'Nine models argue. A Bayesian referee keeps score.',
    lede:
      'Most forecasting tools pick one model and defend it. Eminence runs nine ' +
      'independent quantitative models in parallel, then lets a Bayesian meta-learner ' +
      're-weight them after every cycle based on who was actually right. The models ' +
      'that keep missing quietly lose their vote.',
    features: [
      {
        h: 'A nine-model ensemble, not a single opinion',
        b: 'GARCH(1,1) for volatility clustering. Ornstein-Uhlenbeck for mean reversion. ' +
           'Merton jump diffusion for gaps. Kalman filtering for state smoothing. ARIMA ' +
           'for trend. Wavelet decomposition for multi-scale denoising. Fourier harmonics ' +
           'for cyclicality. An HMM for bull/bear regime. Black-Scholes for option-implied bounds.',
      },
      {
        h: 'The meta-learner that keeps score',
        b: 'After each prediction cycle every model is scored on realised error and its ' +
           'weight updated exponentially — w ← (1−lr)·w + lr·exp(−α·error²). The ensemble ' +
           'is therefore self-correcting: no manual retuning, no stale priors.',
      },
      {
        h: 'Regime detection changes the answer',
        b: 'A hidden Markov layer classifies the market state before the ensemble speaks. ' +
           'Mean-reversion models carry weight in ranging regimes and lose it in trending ' +
           'ones — the way a desk would actually reason.',
      },
      {
        h: 'Backtesting in the same engine that predicts',
        b: 'The backtester consumes the identical model stack used live, so a strategy ' +
           'that tested well is not silently running against different code in production.',
      },
      {
        h: 'Runs entirely on your machine',
        b: 'A native macOS app wrapping a local Python engine and a local interface. ' +
           'Your positions, watchlists, and brain state stay on your disk.',
      },
    ],
    specs: [
      ['Models', '9 — parallel ensemble'],
      ['Meta-learner', 'Bayesian exponential weighting'],
      ['Engine', 'Python · NumPy · SciPy · pandas'],
      ['Interface', 'Next.js'],
      ['State', 'Persistent brain state, on-disk'],
      ['Modules', 'Screener · Backtester · Predictor'],
      ['Platform', 'macOS · Apple Silicon'],
    ],
    glance: [
      { k: 'ENSEMBLE', v: 'Live model weights, updating as errors land' },
      { k: 'BACKTEST', v: 'Equity curve, drawdown, per-model attribution' },
      { k: 'SCREENER', v: 'Ranked candidates with regime context' },
    ],
    download: {
      file: '/downloads/AgentEminence-mac-arm64.zip',
      label: 'AgentEminence-mac-arm64.zip',
      version: '1.0.0',
      size: '209 MB',
      target: 'macOS · Apple Silicon',
    },
  },

  epsilon: {
    id: 'epsilon',
    index: '03',
    slug: '/agent-epsilon',
    name: 'Agent Epsilon',
    display: 'EPSILON',
    accent: '#b57bff',
    classification: 'DUAL-MODE OPERATOR',
    tagline: 'Talk to it. Then reach into it.',
    lede:
      'Epsilon boots as a voice terminal — you speak, a multi-agent stack reasons, it ' +
      'answers out loud and remembers. Then it switches modes and becomes Dirac-Delta: ' +
      'a 3D workspace you manipulate with your hands through the camera, no controller, ' +
      'no mouse. One application, two entirely different ways of being used.',
    features: [
      {
        h: 'Voice in, voice out',
        b: 'Speech-to-text on the way in, neural text-to-speech on the way out, with a ' +
           'reactive lattice that visualises amplitude while it listens and while it ' +
           'speaks. Conversation, not a prompt box.',
      },
      {
        h: 'A multi-agent stack, not one model',
        b: 'A manager dispatches work across specialised agents through a task queue, so ' +
           'a request that needs planning, retrieval, and synthesis gets each from the ' +
           'agent suited to it rather than one model doing all three badly.',
      },
      {
        h: 'Memory that persists between sessions',
        b: 'A memory core holds what you told it and surfaces as a navigable graph. ' +
           'Epsilon opens tomorrow already knowing what you established today.',
      },
      {
        h: 'Dirac-Delta — hands as the input device',
        b: 'Switch modes and the camera becomes the controller. Hand tracking drives ' +
           'gesture recognition and a drawing interpreter, so shapes sketched in the air ' +
           'resolve into geometry inside a holographic grid.',
      },
      {
        h: 'A real 3D workspace underneath',
        b: 'Scene management, a component library, selection, particle systems, and post ' +
           'processing — with a timeline and export path, so what you build in the air ' +
           'leaves as a file.',
      },
      {
        h: 'Instrumented end to end',
        b: 'A diagnostics panel exposes subsystem health live. When something degrades ' +
           'you see which subsystem, not a frozen window.',
      },
    ],
    specs: [
      ['Version', '45.1.0'],
      ['Architecture', 'Dual-mode — Terminal · Workspace'],
      ['Voice', 'Neural STT + TTS'],
      ['Reasoning', 'Multi-agent manager + task queue'],
      ['Memory', 'Persistent core, graph-visualised'],
      ['Input', 'Camera hand tracking · gesture · drawing'],
      ['Shell', 'Electron · Three.js'],
      ['Platform', 'macOS · Apple Silicon'],
    ],
    glance: [
      { k: 'TERMINAL', v: 'Lattice core reacting to voice amplitude' },
      { k: 'MEMORY', v: 'Graph of what it retained, node by node' },
      { k: 'DIRAC-DELTA', v: 'Holographic grid driven by tracked hands' },
    ],
    download: {
      file: '/downloads/AgentEpsilon-45.1.0-arm64.dmg',
      label: 'AgentEpsilon-45.1.0-arm64.dmg',
      version: '45.1.0',
      size: '126 MB',
      target: 'macOS · Apple Silicon',
    },
  },

  fracture: {
    id: 'fracture',
    index: '04',
    slug: '/game-x',
    // Title withheld by the operator's instruction. Codename only.
    name: 'Game X',
    display: 'GAME X',
    accent: '#ff5540',
    classification: 'TITLE WITHHELD',
    tagline: 'An open world that does not exist until you walk into it.',
    lede:
      'A browser-native action RPG with no loading screens and no pre-built map. Terrain ' +
      'is generated from noise in chunks as you move, biome by biome, and the world you ' +
      'get is not the world anyone else got. The full title stays sealed until release.',
    features: [
      {
        h: 'Sixteen biomes, generated not authored',
        b: 'Verdant plains, crystal caverns, volcanic wastes, twilight swamp, astral ' +
           'highlands, the shadow realm and eleven more — each with its own palette, ' +
           'hazards, and spawn logic, streamed in as chunks around you.',
      },
      {
        h: 'Eight classes that play differently',
        b: 'Vanguard, Shadow Walker, Arcanist, Ranger, Paladin, Beastmaster, Duelist, ' +
           'Hexblade — distinct skill trees rather than the same character wearing ' +
           'different armour.',
      },
      {
        h: 'Crafting with consequences',
        b: 'Seventy-five materials feed a forge, a cauldron, and a wand bench. Potions ' +
           'and wands are assembled from what the world actually gave you, so two runs ' +
           'rarely produce the same loadout.',
      },
      {
        h: 'Build your own wand',
        b: 'A dedicated wand system lets you compose spell behaviour instead of picking ' +
           'from a fixed list. The grimoire records what you have discovered.',
      },
      {
        h: 'Real physics, real rendering',
        b: 'Rigid-body physics, an entity-component architecture, and a post-processing ' +
           'chain with bloom and FXAA — running in a browser tab at frame rate.',
      },
      {
        h: 'Nothing phones home',
        b: 'The build is self-contained. No account, no server, no analytics. Open the ' +
           'file and the world generates locally.',
      },
    ],
    specs: [
      ['Title', '[ WITHHELD ]'],
      ['Biomes', '16 — procedurally streamed'],
      ['Classes', '8'],
      ['Materials', '75'],
      ['World', 'Chunked noise generation, infinite'],
      ['Physics', 'Rigid body — cannon-es'],
      ['Render', 'Three.js · bloom · FXAA'],
      ['Runtime', 'Browser · offline capable'],
    ],
    glance: [
      { k: 'OVERWORLD', v: 'Chunks resolving at the horizon as you move' },
      { k: 'FORGE', v: 'Materials into gear, cauldron into potions' },
      { k: 'GRIMOIRE', v: 'Discovered spells and wand compositions' },
    ],
    download: {
      file: '/downloads/ProjectFracture-web-build.zip',
      label: 'GameX-web-build.zip',
      version: 'Preview',
      size: '194 KB',
      target: 'Browser · any platform',
    },
  },
};

export const ORDER = ['cipher', 'eminence', 'epsilon', 'fracture'];
export const LIST = ORDER.map((k) => DOSSIERS[k]);
