# اجرا، استقرار و بازیابی

آخرین تطبیق: **2026-10-30**. بسته استقرار مستقل وجود دارد؛ انتشار عمومی، سرویس خارجی و تأیید ظرفیت تولید انجام‌شده فرض نمی‌شوند.

## توسعه محلی

طبق [README](../README.md)، Node.js 22، npm و Docker Compose لازم‌اند. `compose.yaml` فقط PostgreSQL/Redis/MinIO را اجرا می‌کند؛ API/Vite با `npm run dev` و worker با `npm run worker` جدا هستند. پورت‌های توسعه سرویس‌ها فقط loopback و پورت رابط 3000 است.

قبل از migration یا seed، مقصد متغیرهای محیط را بررسی کنید؛ فایل محیط موجود را بازنویسی نکنید. DATABASE_URL حساب اجرایی school_app و MIGRATION_DATABASE_URL حساب مهاجرت owner است. داده مرورگر خودکار منتقل نمی‌شود و seed تولیدی مجاز نیست. `npm run storage:init` bucket را آماده و versioning را فعال می‌کند؛ فایل موجود را پاک نمی‌کند.

## محیط تولید

Dockerfile رابط و سرور را می‌سازد و runtime غیر root دارد. compose.production.yaml app، worker، ابزار migrate و سرویس‌های خصوصی را تعریف می‌کند. مقادیر واقعی خارج Git باشند:

| متغیر | مسئولیت |
| --- | --- |
| APP_ORIGIN | مبدأ عمومی HTTPS؛ برنامه داخلی همچنان 3000 |
| DATABASE_URL | اتصال school_app به postgres:5432؛ فاقد مالکیت/BYPASSRLS |
| MIGRATION_DATABASE_URL | owner، فقط ابزار مهاجرت؛ در اختیار API قرار نگیرد |
| POSTGRES_PASSWORD، SCHOOL_APP_PASSWORD | رمزهای مستقل؛ نویسه خاص در URL باید percent-encode شود |
| SESSION_SECRET | حداقل ۳۲ نویسه تصادفی؛ تغییر، نشست/پیام رمزگذاری‌شده معوق را تحت تأثیر می‌گذارد |
| S3_ACCESS_KEY/SECRET_KEY | حساب سرویس محدود به bucket خصوصی؛ جدا از مدیر MinIO |
| MINIO_ROOT_USER/PASSWORD | حساب مدیریتی ذخیره‌ساز؛ به API داده نشود |
| TRUSTED_PROXY_CIDRS | فقط پراکسی TLS واقعی؛ Host دلخواه مرجع اعتماد نیست |
| METRICS_TOKEN | راز مستقل پایش |
| SMS_WEBHOOK_URL/TOKEN | قرارداد ارائه‌دهنده پیامک |
| BALE_BOT_TOKEN/USERNAME، BALE_WEBHOOK_SECRET | ربات و وب‌هوک اتصال شخصی؛ در API و worker تنظیم شوند |

```sh
docker compose --env-file .env.production -f compose.production.yaml build
docker compose --env-file .env.production -f compose.production.yaml up -d postgres redis storage
docker compose --env-file .env.production -f compose.production.yaml --profile tools run --rm migrate
```

همه مهاجرت‌های موجود تا 013 باید قبل از API و worker جدید اعمال شوند؛ readiness وجود بخشی از جدول‌های لازم و حساب غیر bypass را کنترل می‌کند. migration روی داده واقعی فقط پس از پشتیبان و بررسی محیط مقصد انجام شود.

bucket خصوصی و حساب سرویس MinIO را آماده کنید. نخستین مدیر از ابزار cli با BOOTSTRAP_USERNAME/NAME/PHONE/PASSWORD امن ساخته می‌شود؛ رمز پیش‌فرض نیست. پس از bootstrap، متغیرهای موقت را حذف کنید. ورود رمزی به سرویس پیامک وابسته نیست؛ فعال‌سازی/بازیابی و روش پیامکی وابسته‌اند.

```sh
docker compose --env-file .env.production -f compose.production.yaml up -d app worker
```

app روی loopback:3000 است. TLS ingress بیرون Compose تنظیم می‌شود؛ نمونه infra/nginx.conf.example موجود است. DB/Redis پورت عمومی تولید ندارند. برای callback بله، ورودی HTTPS عمومی پراکسی به همان برنامه هدایت شود؛ پورت داخلی برنامه تغییر نمی‌کند.

## صف‌ها و سرویس‌های بیرونی

worker هم outbox/BullMQ را پردازش می‌کند، هم اعلان عمومی زنگوله را دسته‌ای تحویل می‌دهد و هم سیاست خام آمار را اجرا می‌کند. خاموش‌بودن آن با موفقیت ذخیره اطلاعیه یا رسید یکی نیست؛ ذخیره می‌تواند موفق و تحویل هنوز معلق باشد.

SMS bridge درخواست `{to,message,reference}` با Authorization می‌گیرد و باید `{accepted:true,messageId:string}` برگرداند؛ reference تکراری را بدون ارسال مجدد مدیریت کند. timeout می‌تواند نتیجه تحویل مبهم بسازد؛ دقیقاً یک‌بار ارسال بیرونی تضمین نشده است.

بله به ربات، secret وب‌هوک و اتصال تأییدشده گیرنده نیاز دارد. اطلاعات تماس پرونده مبنای پیام مستقیم نیست. [راهنمای عملیات و بله](OPERATIONS_SETUP.md) قرارداد و نمونه ثبت وب‌هوک را دارد. بدون تنظیم، مسیرهای مربوط ناموجود/غیرفعال‌اند؛ درگاه بانک متصل نیست و پرداخت دستی فعال است.

## نگهداری و پایش

- `/api/v1/health` و `/ready` و سنجه `/metrics` با Bearer token بررسی شوند. ready سلامت ذخیره‌ساز و ارائه‌دهنده را به‌تنهایی تضمین نمی‌کند.
- خطا/تأخیر API، عمق/تأخیر صف، شکست ارسال، ذخیره‌ساز و خطای پشتیبان در محیط مقصد هشدار واقعی می‌خواهند؛ ساخت endpoint به معنی فعال‌بودن هشدار نیست.
- آمار خام پیش‌فرض فعال ۱۸۰ روز، قابل توقف و تنظیم ۹۰ تا ۷۳۰ روز است. worker حذف هزار‌ردیفی دارد؛ داده حذف‌شده با افزایش مدت برنمی‌گردد. سیاست آموزشی/مالی/ممیزی جداست.
- پاک‌سازی دوره‌ای همه نشست‌ها، کدها و idempotency را انجام‌شده فرض نکنید؛ سیاست تحلیلی جای آن نیست.

## پشتیبان و بازیابی

BACKUP_KEY مستقل و تصادفی حداقل ۳۲ نویسه را خارج میزبان هم نگه دارید. BACKUP_COMPOSE_FILE، BACKUP_DATABASE_OWNER/NAME، BACKUP_S3_ENDPOINT و مجوزهای مقصد درست باشند. کلید کنار پشتیبان یا در Git نباشد.

```sh
npm run backup:create
npm run backup:verify -- schools-<timestamp>-<id>
```

dump DB، objectهای فعلی bucket و manifest با AES-256-GCM رمز می‌شوند؛ تاریخچه نسخه‌های S3 صادر نمی‌شود. نگهداری سی‌روزه با create موفق اعمال می‌شود. برای snapshot سازگار، نوشتن API و worker موقتاً متوقف شود؛ DB/S3 تراکنش اتمیک مشترک ندارند.

verify مقصد تصادفی تازه می‌سازد و محیط زنده را بازنویسی نمی‌کند. اپراتور باید نمونه جدا را به DB/bucket بازیابی‌شده متصل، فایل/مجوز را بررسی و سپس ورودی را جابه‌جا کند. بررسی قبلی با bucket بدون object، تأیید کامل بازیابی فایل نبوده است.

نمونه service/timer روزانه در infra هست، اما فعال‌سازی میزبان، مسیر/کاربر/EnvironmentFile، انتقال نسخه رمزگذاری‌شده خارج سرور و هشدار بر عهده استقرار است. RPO یک روز و RTO چهار ساعت هدف‌اند، نه نتیجه اندازه‌گیری تولید. چند نمونه API ممکن است؛ ظرفیت پنجاه هزار حساب/هزار کاربر فعال تأیید نشده است.
