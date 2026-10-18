# Future handoffs

இந்த directory, ஏற்கெனவே உள்ள My Dream Woman Pro GitHub app-ஐத் தொடர்ந்து பராமரிக்க அடுத்த agent பயன்படும் உறுதிப்படுத்தப்பட்ட handoff தகவல்களுக்கானது. புதிய app உருவாக்க வேண்டாம்.

## தற்போதைய நிலை
- Step 1 read-only audit: **முடிந்தது** — [step-1-audit.md](step-1-audit.md).
- Step 2 shared design-token foundation: **முடிந்தது** — [step-2-design-system.md](step-2-design-system.md).
- Step 2 visual design board and icon concept exports: **முடிந்தது** — [design guide](../docs/design-system/README.md), [UI implementation guide](../docs/AGENTS.md), and [updated Step 2 handoff](step-2-design-system.md) (handoff update commit `adafeb66f752`). The icon exports remain design-only and are not wired into app assets.
- Steps 2–6 branch: `feature/black-leather-royal-gold` (இன்னும் `main`-க்கு merge செய்யப்படவில்லை). Step 2 token code commit `3e69dd3855e1576e7a5bdbfab1f1bd53f458af41`; Step 2 handoff/docs commit `f94c6cf6f0dea6d96a3aabe63f253551445e5ed6`.
- Step 3 Settings modal, `/settings`, `/keys` UI redesign: **code முடிந்தது** — [step-3-settings.md](step-3-settings.md); code commit `1b80712041b1be007147dfaedec83d045dd95f96`.
- Step 3 app typecheck மற்றும் live UI preview: **சரிபார்க்க முடியவில்லை** — worktree-ல் `node_modules` இல்லை; Expo workflow `expo` executable இல்லாததால் தொடங்கவில்லை. Dependency/lockfile பிரச்சினைகளை மாற்றவில்லை.
- Step 4a Chat message/send/history: **முடிந்தது** — [step-4a-chat-messages-history.md](step-4a-chat-messages-history.md); code commit `e7d25367a9dfe98e64cb7094f2dda06f85855e2f` (feature branch மட்டும்).
- Step 4a TypeScript TSX syntax parse மற்றும் diff whitespace check: **வெற்றி**; முழு app typecheck/device runtime: **சரிபார்க்க முடியவில்லை** — இந்த workspace-ல் app checkout மற்றும் Expo dependencies இல்லை.
- Step 4b Character list, character edit/save, URL மற்றும் navigation UI: **code முடிந்தது** — [step-4b-character-management.md](step-4b-character-management.md). Typecheck/live preview முடியவில்லை; காரணமும் verification வரம்பும் handoff-ல் பதிவு செய்யப்பட்டுள்ளது.
- Step 5 Cloudinary, Gallery, Image-to-Script UI restyle: **code முடிந்தது** — [step-5-cloudinary-gallery-image-to-script.md](step-5-cloudinary-gallery-image-to-script.md); code commit `80be37c30bf8ecd4730e7334bc0d6fd95d187028`.
- Step 5 TSX syntax, shared-color mapping/helper checks மற்றும் diff whitespace check: **வெற்றி**; full app typecheck மற்றும் live device preview: **சரிபார்க்க முடியவில்லை** — app dependencies/Expo types இந்த workspace-ல் இல்லை.
- Step 6 Script-to-Image + Face Swap UI restyle: **code முடிந்தது** — [step-6-script-to-image-and-swap.md](step-6-script-to-image-and-swap.md); code commit `78642ac1df1c635945d16cf7aa1ba77c21937edc`.
- Step 6 TSX syntax மற்றும் diff whitespace checks: **வெற்றி**; full app typecheck மற்றும் live preview: **சரிபார்க்க முடியவில்லை** — Expo dependencies/workflow கிடைக்கவில்லை.
- Step 7 regression validation: **நிலுவை** — Step 1 diff/path மற்றும் chat behavior read-only checks செய்யப்பட்டன; மீதமுள்ள ஆபத்துகள் [Remaining Risks](remaining-risks.md)-ல் உள்ளன.
- ஆய்வு செய்த app source commit: `7a1fadc0a928b6975edecd1e8d646c67382ce0fb`.
- Step 1 handoff commit-ல் `future/` ஆவணங்கள் மட்டும் சேர்க்கப்பட்டன; அப்போது app source/assets மாற்றப்படவில்லை.
- Step 1-க்கு GitHub Action trigger செய்யப்படவில்லை.

## கட்டாய guardrails
- `/welcome` மற்றும் `artifacts/tamil-ai-chat/app/home.tsx` மாற்றக்கூடாது.
- ஏற்கெனவே உள்ள செயல்பாடுகள், integrations, handlers, API payloads, storage, notifications மற்றும் media flows-ஐ பாதுகாக்கவும்.
- User-ன் தெளிவான OK இல்லாமல் எந்த error அல்லது CI failure-யும் fix செய்யக்கூடாது; முதலில் காரணத்தை report செய்து காத்திருக்கவும்.
- Visual direction: premium futuristic; obsidian/கருப்பு அடிப்படை, glossy அடுக்குகள் மற்றும் மென்மையான glow; electric purple, teal/green, cyan/blue, அளவான gold. Status-களுக்கு role-based semantic நிறங்கள்; தமிழ் copy-ஐ பாதுகாக்கவும். Settings, PIN, Image Studio reference screenshots வழிகாட்டியாகப் பயன்பட வேண்டும்.
- ஒவ்வொரு code phase-க்கும் local checks செய்து, feature branch-ல் ஒரு commit/push செய்யவும். Step 1–6-ல் GitHub Actions build எதையும் trigger செய்யக்கூடாது. Step 7 முழு regression முடிந்தபின் final commit/push செய்து `Build APK`-ஐ trigger செய்யவும். Build தோல்வியடைந்தால் நிறுத்தி failure paths-ஐ parallel-ஆக ஆராய்ந்து report செய்யவும்; பயனர் தெளிவாக OK சொல்வதற்கு முன் fix செய்யக்கூடாது.
- தற்போதைய Actions பட்டியலில் `Build APK` மட்டுமே உள்ளது. அது manual `workflow_dispatch` மூலம் GitHub Release-ஐ delete/recreate செய்து APK வெளியிடும்; அதனால் Step 1–6-ல் build செய்ய வேண்டாம். Step 7-ல் மட்டும் trigger செய்யவும். `deploy_render` default false-ஆகவே இருக்க வேண்டும்.

## கட்டம்-வாரியான handoff பதிவு

- ஒவ்வொரு step முடிந்ததும், `future/step-N-<சுருக்கப்பெயர்>.md` என்ற file-ல் முடிந்த scope, மாற்றிய files, verification/build முடிவு, commit SHA, blockers, அடுத்த step மற்றும் pending approval-களை பதிவு செய்யவும். Step 1-க்கு உள்ள `step-1-audit.md` பெயரிடும் முறையைப் பின்பற்றவும்.
- ஒவ்வொரு step முடிந்ததும் `future/README.md`-ல் தற்போதைய status, முடிந்த step, அந்த step-ல் செய்யப்பட்ட மாற்றங்கள், verification/build நிலை (build இல்லையெனில் அதையும்), அடுத்த step, தேவையான approval, handoff file link ஆகியவற்றைப் புதுப்பிக்கவும். Verified evidence மட்டுமே குறிப்பிடவும்; secrets சேர்க்க வேண்டாம்.
- Handoff docs-ஐ GitHub-க்கு normal commit/push ஆகச் சேர்க்கவும்; இது `Build APK` workflow-ஐ trigger செய்யும் முறை அல்ல. Docs-only update-க்கு APK build தேவையில்லை.
- ஒவ்வொரு code step-லும் local checks முடிந்த பின் feature branch-க்கு commit/push செய்யவும்; Step 1–6-ல் Actions build இல்லை. ஒவ்வொரு step முடிவிலும் மாற்றங்களை `future/README.md`-ல் பதிவு செய்யவும். Step 7-ல் final regression முடித்து final push செய்த பின் மட்டும் full `Build APK` workflow-ஐ trigger செய்யவும். Build தோல்வியடைந்தால் failure paths-ஐ parallel-ஆக ஆய்வு செய்து report செய்யவும்; fix செய்ய user-ன் தெளிவான OK தேவை.

## Futuristic UI/UX redesign brief

- ஏற்கெனவே உள்ள Expo/React Native app-ஐ மட்டும் பராமரிக்கவும்; புதிய mobile app உருவாக்க வேண்டாம்.
- Scope: app icon, Settings மற்றும் அதன் உள்ளமைந்த options, Chat, Character list/Edit, Cloudinary, Image-to-Script, Script-to-Image, Swap மற்றும் அவற்றின் options. ஒவ்வொரு screen-ன் current functions/handlers/API/navigation/storage/upload/media flows-ஐப் பாதுகாக்கவும்.
- Reference: பயனர் வழங்கிய Settings, PIN, Image Studio screenshots. Premium futuristic theme-ஐப் பயன்படுத்தவும்; status-களுக்கு semantic role-based colors, தமிழ் copy-ஐப் பாதுகாப்பது கட்டாயம்.
- Expo/React Native-க்கு ஏற்ற design system-ல் color tokens/roles, typography, spacing, borders/radii/glow, cards, buttons, inputs, toggles, sheets, icons, empty/loading/progress/error/media states ஆகியவை வரையறுக்கப்பட வேண்டும்.
- Design system உருவாக்கும் முன் workspace-ல் `My Dream Women Design System` artifact உள்ளதா தேடவும்; இது இந்த app-க்கானதாக இருந்தால் அதையே முடித்து/present செய்யவும், duplicate உருவாக்க வேண்டாம். Design system-உடன் `docs/AGENTS.md` சேர்த்து tokens/components-ஐ எப்படிப் பயன்படுத்துவது என்பதை விளக்கவும்.
- உடனடி deliverable: design system-ஐ முடித்து/present செய்வது மட்டும்; app screen redesign இன்னும் தொடங்கக்கூடாது. `/welcome` (`artifacts/tamil-ai-chat/app/welcome.tsx`), Home (`artifacts/tamil-ai-chat/app/home.tsx`) மற்றும் splash எப்போதும் மாற்றப்படக்கூடாது.

## பயனர் வரையறுத்த ஏழு கட்டங்கள்

1. **Step 1 — Read-only baseline:** ஒவ்வொரு screen-ன் handlers, state, API/navigation/storage, upload மற்றும் error paths-ஐ map செய்து build baseline-ஐப் பதிவு செய்யவும். `future/step-1-audit.md`-ல் read-only audit முடிந்துள்ளது; அதன் local-check வரம்புகளைப் பின்பற்றவும். இந்த கட்டத்தில் code change/push/build கிடையாது.
2. **Step 2 — Design foundation + app icon:** design tokens/components மற்றும் icon design-ஐ வரையறுத்து/present செய்யவும். முதலில் proposed app icon-ன் screenshot/mockup-ஐ பயனருக்கு அனுப்பி வெளிப்படையான OK பெறவும்; அதற்கு முன் actual app icon asset-ஐ மாற்றக்கூடாது. OK பிறகே app icon asset-ஐ மாற்றி feature branch-க்கு code-ஐ push செய்யவும். Home/Welcome/splash-ஐத் தொடக்கூடாது.
3. **Step 3 — Settings + உள்ளமைந்த options:** Online, Auto Message/AI, ringtone, character interval, PIN, Keys & Accounts உள்ளிட்ட controls-ஐ cover செய்து ஒவ்வொன்றின் தற்போதைய behavior-ஐச் சோதிக்கவும்.
4. **Step 4 — Chat + Character list/Edit:** message send/history, character தேர்வு, edit/save மற்றும் navigation flows-ஐப் பாதுகாத்து சோதிக்கவும்.
5. **Step 5 — Cloudinary + Gallery + Image-to-Script:** upload, preview, gallery, generation மற்றும் empty/loading/error states-ஐ cover செய்யவும்.
6. **Step 6 — Script-to-Image + Swap:** model/options, prompt, generate/swap, results மற்றும் media handling-ஐ cover செய்யவும்.
7. **Step 7 — Full regression:** அனைத்து screen/function paths-ஐ மீண்டும் சோதித்து, Home/Welcome diff இல்லை என உறுதிப்படுத்தி, final push-க்கு பின் முழு `Build APK` workflow-ஐ trigger செய்யவும். Step 1–6-ல் Actions build இல்லை.

ஒவ்வொரு code கட்டத்திலும் app screens/functions-ஐ மாற்றுவதற்கு முன் தேவையான user approval பெறவும். உடனடி design-system task-ஐ மட்டும் செய்ய வேண்டும்; UI implementation-க்கு செல்ல வேண்டாம். Request-ல் design system-ஐ ஒரிடத்தில் Step 3 என்றும், roadmap-ல் Step 2 என்றும் அழைக்கிறது; scope design-system-only ஆகவே வைத்துக் கொண்டு, implementation தொடங்கும்முன் phase numbering-ஐ உறுதிப்படுத்தவும்.

## தற்போதைய Actions வரம்பு

GitHub Actions-ல் தற்போது `Build APK` workflow மட்டுமே உள்ளது; தனி validation-only workflow இல்லை. `Build APK` manual `workflow_dispatch` மூலம் இயக்கப்பட்டு GitHub Release tag-ஐ delete/recreate செய்து APK வெளியிடும். ஆகவே Step 1–6 முடியும் வரை எந்த Actions build-யும் trigger செய்ய வேண்டாம். Step 7-ல் full regression மற்றும் final push முடிந்த பிறகே `Build APK`-ஐ trigger செய்யவும். `deploy_render` default false-ஆக இருக்க வேண்டும். README-only மாற்றங்களுக்கு APK build தேவையில்லை.
