# استقرار مستقل

## محلی

دستورهای README را اجرا کنید. سرویس‌های Compose توسعه پورت‌های loopback جدا دارند. API با school_app فاقد مالکیت و BYPASSRLS و migration با school_owner اجرا می‌شود. اطلاعات قدیمی مرورگر خودکار منتقل نمی‌شوند.

## تولید

Dockerfile رابط و سرور را می‌سازد و runtime با کاربر غیر root است. compose.production.yaml برنامه، worker، migration و سرویس‌های خصوصی را تعریف می‌کند. انتشار عمومی انجام نشده است.

در فایل محیط خارج Git تنظیم کنید:

- APP_ORIGIN: مبدأ HTTPS واقعی. پورت برنامه 3000 باقی می‌ماند.
- POSTGRES_PASSWORD و SCHOOL_APP_PASSWORD: رمزهای مستقل owner و runtime. DATABASE_URL به school_app@postgres:5432/schools و MIGRATION_DATABASE_URL به owner اشاره کنند. نویسه‌های ویژه رمز در URL باید percent-encode شوند.
- SESSION_SECRET: راز تصادفی خصوصی حداقل 32 نویسه؛ تغییر آن نشست‌ها و رمزگشایی پیام‌های معوق قبلی را تحت تأثیر قرار می‌دهد.
- MINIO_ROOT_USER/PASSWORD: مدیر ذخیره‌سازی؛ S3_ACCESS_KEY/SECRET_KEY: حساب سرویس مستقل محدود به school-private. حساب مدیریت را به API ندهید.
- TRUSTED_PROXY_CIDRS: فقط آدرس پراکسی TLS واقعی. نمونه infra/nginx.conf.example هدر آدرس مبدأ را بازنویسی می‌کند.
- METRICS_TOKEN: راز مستقل پایش؛ اطلاعات پیام‌رسان‌ها بعد از انتخاب ارائه‌دهنده تنظیم شوند.

```sh
docker compose --env-file .env.production -f compose.production.yaml build
docker compose --env-file .env.production -f compose.production.yaml up -d postgres redis storage
docker compose --env-file .env.production -f compose.production.yaml --profile tools run --rm migrate
```

پیش از اجرای app، bucket خصوصی و حساب سرویس S3 را در MinIO ایجاد کنید. storage-init نسخه‌بندی bucket را فعال می‌کند و به مجوز عملیاتی مربوط نیاز دارد. نخستین مدیر با node build/server/cli.js bootstrap-admin در کانتینر ابزار و متغیرهای BOOTSTRAP امن ساخته می‌شود. ورود مدیر تولید نیازمند سرویس پیامک تنظیم‌شده است.

```sh
docker compose --env-file .env.production -f compose.production.yaml up -d app worker
```

TLS ingress بیرون Compose تنظیم می‌شود. app فقط روی loopback:3000 است؛ DB و Redis پورت عمومی ندارند. سلامت /api/v1/health، آمادگی /api/v1/ready و سنجه /api/v1/metrics است. metrics به Bearer token نیاز دارد. چند نمونه API ممکن است؛ ظرفیت تولید تأیید نشده است.

## سرویس‌ها

SMS bridge درخواست POST با {to,message,reference} و Authorization دریافت می‌کند؛ پاسخ باید {accepted:true,messageId:string} باشد. bridge باید reference تکراری را بدون ارسال مجدد مدیریت کند. Bale به bot token و شناسه گیرنده معتبر نیاز دارد. timeout سرویس بیرونی می‌تواند تحویل مبهم ایجاد کند؛ ارسال دقیقاً یک‌بار بیرونی تضمین نشده است. درگاه بانکی متصل نیست؛ پرداخت دستی فعال است.

## پشتیبان و بازیابی

BACKUP_KEY مستقل و تصادفی حداقل 32 نویسه تنظیم و نسخه‌ای خارج سرور نگه دارید. BACKUP_COMPOSE_FILE، BACKUP_DATABASE_OWNER/NAME، BACKUP_S3_ENDPOINT و اطلاعات دسترسی S3 به محیط هدف اشاره کنند. کلید را در Git یا کنار پشتیبان نگه ندارید.

```sh
npm run backup:create
npm run backup:verify -- schools-<timestamp>-<id>
```

dump پایگاه داده، نسخه فعلی objectهای bucket و manifest با AES-256-GCM رمز می‌شوند. تاریخچه نسخه‌های S3 صادر نمی‌شود. نگهداری 30 روز با اجرای موفق create اعمال می‌شود. برای snapshot سازگار DB و فایل‌ها، نوشتن API و worker را موقتاً متوقف کنید؛ این دو سامانه snapshot اتمیک مشترک ندارند.

verify مقصد تصادفی جدید می‌سازد و محیط زنده را بازنویسی نمی‌کند. اپراتور پس از بررسی نتیجه باید یک نمونه جدا را به DB و bucket بازیابی‌شده متصل، فایل و مجوزها را بررسی و سپس ورودی را جابه‌جا کند. بازگردانی روی محیط زنده خودکار نشده است.

نمونه service/timer روزانه در infra ارائه شده؛ روی میزبان فعال نشده است. مسیر پروژه، کاربر و EnvironmentFile باید تنظیم و خطاها پایش شوند. نسخه رمزگذاری‌شده را روزانه به محل مستقل منتقل کنید. RPO یک روز و RTO چهار ساعت هدف عملیاتی‌اند و در محیط تولید اندازه‌گیری نشده‌اند.
