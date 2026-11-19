-- PeopleLens: readable addresses for channel pages (/channel/<slug>).
-- Run once in the Supabase SQL editor BEFORE deploying the channel pages.
-- Fills all 68 channels. Safe to re-run: the column and index use IF NOT EXISTS.
BEGIN;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "Channel" SET "slug" = 'news24-up-uttarakhand' WHERE "id" = 'cmrvss9j2000cgegsi33fyr7b'; -- News24 UP & Uttarakhand
UPDATE "Channel" SET "slug" = 'rajasthan-patrika' WHERE "id" = 'cmrw4x1am00009tg9szysrb7x'; -- Rajasthan Patrika
UPDATE "Channel" SET "slug" = 'news-tak' WHERE "id" = 'cmrxdylev0000p9t0l18pom6b'; -- News Tak
UPDATE "Channel" SET "slug" = 'surender-sharma' WHERE "id" = 'cmrxexc9j0000j0ip7mbf1u7y'; -- Surender Sharma
UPDATE "Channel" SET "slug" = 'lokmathindi' WHERE "id" = 'cmrw6sobp000072f282krow5a'; -- LokmatHindi
UPDATE "Channel" SET "slug" = 'mint' WHERE "id" = 'cmrxvu0wg00008qr9oynxa6up'; -- Mint
UPDATE "Channel" SET "slug" = 'abc-news-australia' WHERE "id" = 'cmrxvx55m00038qr90xf33vfd'; -- ABC News (Australia)
UPDATE "Channel" SET "slug" = 'live-hindustan' WHERE "id" = 'cmryqjwjw0000pwylz5xobb5p'; -- Live Hindustan
UPDATE "Channel" SET "slug" = 'up-tak' WHERE "id" = 'cmrysewba00001u7gv500m7qj'; -- UP Tak
UPDATE "Channel" SET "slug" = 'abplive' WHERE "id" = 'cmrz6b85700005vh7u9k23l50'; -- ABPLIVE
UPDATE "Channel" SET "slug" = 'sohit-mishra-official' WHERE "id" = 'cmrz8bf6f0000jzyjseqclc2k'; -- Sohit Mishra Official
UPDATE "Channel" SET "slug" = 'shyam-rangeela' WHERE "id" = 'cms035se50000tqjt8t2ark9x'; -- Shyam Rangeela
UPDATE "Channel" SET "slug" = 'ndtv-india' WHERE "id" = 'cms051ija0000i8l603nhgl9d'; -- NDTV India
UPDATE "Channel" SET "slug" = 'rajendra-gupta-uwach' WHERE "id" = 'cms07l0ve0000hyniqgiwodj8'; -- Rajendra Gupta Uwach
UPDATE "Channel" SET "slug" = 'crime-tak' WHERE "id" = 'cms0kyoiu0000y5t1z3o61gox'; -- Crime Tak
UPDATE "Channel" SET "slug" = 'seedhe-maut' WHERE "id" = 'cms1n9yq70003yulizf5dbv29'; -- Seedhe Maut
UPDATE "Channel" SET "slug" = 'saksham-dhyani' WHERE "id" = 'cms1qvrbe0000jse8ph1vqa4l'; -- Saksham Dhyani
UPDATE "Channel" SET "slug" = 'tarun-bisht' WHERE "id" = 'cms1rk1op000012lfsjtwf73l'; -- Tarun Bisht
UPDATE "Channel" SET "slug" = 'priyank-arya' WHERE "id" = 'cms20pcgz0000nzyb6yaxj176'; -- Priyank Arya
UPDATE "Channel" SET "slug" = 'cna' WHERE "id" = 'cms358ph30000ph7wzd5wvvux'; -- CNA
UPDATE "Channel" SET "slug" = 'bbc-news' WHERE "id" = 'cms442uq70004j86l7wlej0jo'; -- BBC News
UPDATE "Channel" SET "slug" = 'kiddocracy' WHERE "id" = 'cmsacpcz80000bncs4388tf86'; -- Kiddocracy
UPDATE "Channel" SET "slug" = 'bloomberg-originals' WHERE "id" = 'cmsbcjqno0000116y8ioqx60i'; -- Bloomberg Originals
UPDATE "Channel" SET "slug" = 'the-hindu' WHERE "id" = 'cmrvsxb52000fgegsyd7bus2l'; -- The Hindu
UPDATE "Channel" SET "slug" = 'lokaarpan' WHERE "id" = 'cmsilcshs0009epy8rxowavps'; -- लोकार्पण - LOKAARPAN
UPDATE "Channel" SET "slug" = 'ndtv-profit' WHERE "id" = 'cmsoi5d1f000012l6yv9qil1q'; -- NDTV Profit
UPDATE "Channel" SET "slug" = 'makx-hit-music' WHERE "id" = 'cmrxdplr70000mr3yqvvde6rf'; -- MAKX HIT MUSIC🎶
UPDATE "Channel" SET "slug" = 'lallantop-up' WHERE "id" = 'cmst774bj0000p3q894mmvqkx'; -- Lallantop UP
UPDATE "Channel" SET "slug" = 'unfiltered-by-samdish-and-a-fantastic-team' WHERE "id" = 'cmrubihc80006uysolg0gwu0f'; -- Unfiltered by Samdish (and a fantastic team)
UPDATE "Channel" SET "slug" = 'aaj-tak' WHERE "id" = 'cms4ufjhp0000v4r46bmmrns6'; -- Aaj Tak
UPDATE "Channel" SET "slug" = 'dibang-official' WHERE "id" = 'cmrwdclz40000uylb777nzhdg'; -- Dibang Official
UPDATE "Channel" SET "slug" = 'rajasthan-tak' WHERE "id" = 'cmt5o0gnb0003irc1fkylzqzg'; -- Rajasthan Tak
UPDATE "Channel" SET "slug" = 'dilli-tak' WHERE "id" = 'cmt624edy0000hmo38g65fod4'; -- Dilli Tak
UPDATE "Channel" SET "slug" = 'dw-news' WHERE "id" = 'cmruwewwo0006oskxtgb9ezfz'; -- DW News
UPDATE "Channel" SET "slug" = 'new-york-times-opinion' WHERE "id" = 'cmthdog9c0000vc1mr2mfynhy'; -- New York Times Opinion
UPDATE "Channel" SET "slug" = 'india-today' WHERE "id" = 'cms4uh06r0003v4r4wwqv3lpm'; -- India Today
UPDATE "Channel" SET "slug" = 'bbc-news-india' WHERE "id" = 'cmskg5lrl000330obwaorzmn0'; -- BBC News India
UPDATE "Channel" SET "slug" = 'kk-create' WHERE "id" = 'cmtx36o870003mfobreenlfl8'; -- KK Create
UPDATE "Channel" SET "slug" = 'edge-news' WHERE "id" = 'cmu1hvpj700005ycnnkyoku8n'; -- Edge News
UPDATE "Channel" SET "slug" = 'brut-india' WHERE "id" = 'cms039qs40003tqjtwmgfpx08'; -- Brut India
UPDATE "Channel" SET "slug" = 'siddhartha-joshi' WHERE "id" = 'cmu2wxqzc0003125c4ku3ag27'; -- Siddhartha Joshi
UPDATE "Channel" SET "slug" = 'zero1-hindi-by-zerodha' WHERE "id" = 'cmuwe7n3u0000i0ihbsq279bu'; -- Zero1 Hindi by Zerodha
UPDATE "Channel" SET "slug" = 'thirdpole-live' WHERE "id" = 'cmt4oz1jm0000dci22kov1yrz'; -- Thirdpole live
UPDATE "Channel" SET "slug" = 'ghughuti' WHERE "id" = 'cmuyf35la000612zxjamu3add'; -- Ghughuti
UPDATE "Channel" SET "slug" = 'dekoder' WHERE "id" = 'cmrw2e7vu0000qs1b1izhh7mu'; -- DeKoder
UPDATE "Channel" SET "slug" = 'anurag-tiwari' WHERE "id" = 'cmv80l97m0000120vzkc75usc'; -- Anurag Tiwari
UPDATE "Channel" SET "slug" = 'khabargaon' WHERE "id" = 'cmrw5gsk30000nwsacgax0k49'; -- Khabargaon
UPDATE "Channel" SET "slug" = 'reuters' WHERE "id" = 'cmvath6bf0000uzauuzgb1ai4'; -- Reuters
UPDATE "Channel" SET "slug" = 'the-lallantop' WHERE "id" = 'cmrvt0tjg000igegsez2snq2v'; -- The Lallantop
UPDATE "Channel" SET "slug" = 'jist' WHERE "id" = 'cmsil6b2y0003epy8ws2awm9w'; -- Jist
UPDATE "Channel" SET "slug" = 'newslaundry' WHERE "id" = 'cms1po11f00003tt8dhyd967t'; -- newslaundry
UPDATE "Channel" SET "slug" = 'news-24' WHERE "id" = 'cmrtdh85i0005tjm4oy1nafab'; -- News 24
UPDATE "Channel" SET "slug" = 'molitics' WHERE "id" = 'cmrw5shhd0009nwsasxcbt6rz'; -- Molitics
UPDATE "Channel" SET "slug" = 'doublecheck-by-sanket-upadhyay' WHERE "id" = 'cmrudfsqw0000v8pmnyy57pxw'; -- DoubleCheck By Sanket Upadhyay
UPDATE "Channel" SET "slug" = 'bbc-news-hindi' WHERE "id" = 'cmrz1ljmw0000kqb7uhtnplz5'; -- BBC News Hindi
UPDATE "Channel" SET "slug" = 'theredmike' WHERE "id" = 'cmrtdf5860000tjm4wk967gtl'; -- TheRedMike
UPDATE "Channel" SET "slug" = 'peek-tv' WHERE "id" = 'cmt7d4wkj0003147n4sjeesma'; -- Peek TV
UPDATE "Channel" SET "slug" = 'the-india-story-with-naghma' WHERE "id" = 'cmw9n0s9p00007146m0miotkw'; -- The India Story with Naghma
UPDATE "Channel" SET "slug" = 'jansatta' WHERE "id" = 'cmrw5pn350006nwsa0cc5vp2j'; -- Jansatta
UPDATE "Channel" SET "slug" = 'newslaundry-hindi' WHERE "id" = 'cmwan12ea0000xtpsxayoltj8'; -- Newslaundry Hindi
UPDATE "Channel" SET "slug" = 'the-wire' WHERE "id" = 'cmtn0acnm0000ddpj8ugp1i3o'; -- The Wire
UPDATE "Channel" SET "slug" = 'baramasa' WHERE "id" = 'cmruw8trv0000oskxtst8enc7'; -- Baramasa
UPDATE "Channel" SET "slug" = 'sharad-sharma-on-ground' WHERE "id" = 'cmruj90rc000013x4c1ebpvff'; -- Sharad Sharma on Ground
UPDATE "Channel" SET "slug" = 'the-indian-express' WHERE "id" = 'cmruwaxln0003oskxkpbozncf'; -- The Indian Express
UPDATE "Channel" SET "slug" = 'news-pinch' WHERE "id" = 'cmrt6rox200007luwd770nrin'; -- News Pinch
UPDATE "Channel" SET "slug" = 'kafal-tree-live' WHERE "id" = 'cms03keqq0000f1as7gf3ahfc'; -- Kafal Tree Live
UPDATE "Channel" SET "slug" = 'eco-n-energy-talk' WHERE "id" = 'cms4hayt30000uci7l6shb14a'; -- Eco N Energy Talk
UPDATE "Channel" SET "slug" = 'indian-express-hindi' WHERE "id" = 'cmrt78rcz0001ymaiweioczl7'; -- Indian Express Hindi
CREATE UNIQUE INDEX IF NOT EXISTS "Channel_slug_key" ON "Channel"("slug");
COMMIT;

-- Check (should return 0):
SELECT count(*) AS channels_without_slug FROM "Channel" WHERE "slug" IS NULL;
