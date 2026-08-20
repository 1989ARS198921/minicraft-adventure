# Подписание APK для RuStore

## Шаг 1: Создание ключа подписания

Откройте PowerShell и выполните:

```powershell
cd app\android

keytool -genkey -v -keystore minicraft-release.keystore -alias minicraft -keyalg RSA -keysize 2048 -validity 10000 -storepass YourPassword123 -keypass YourPassword123 -dname "CN=MiniCraft, OU=Dev, O=YourName, L=City, ST=State, C=RU"
```

Это создаст файл `minicraft-release.keystore` в папке `app/android/`.

> **Важно:** Сохраните ключ! Без него невозможно обновить приложение в RuStore.

## Шаг 2: Создание файла конфигурации signing

Создайте файл `app/android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=minicraft-release.keystore
MYAPP_RELEASE_KEY_ALIAS=minicraft
MYAPP_RELEASE_STORE_PASSWORD=YourPassword123
MYAPP_RELEASE_KEY_PASSWORD=YourPassword123
```

> **Важно:** Не коммитьте этот файл в Git! Он уже в `.gitignore`.

## Шаг 3: Обновление build.gradle

Откройте `app/android/app/build.gradle` и добавьте блок signingConfigs:

```groovy
apply plugin: 'com.android.application'

// Signing config
def getReleaseTimestamp = { ->
    def df = new java.text.SimpleDateFormat("yyyyMMdd'T'HHmmss")
    df.setTimeZone(java.util.TimeZone.getTimeZone("UTC'))
    return df.format(new Date())
}

android {
    // ... существующий код ...
    
    signingConfigs {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

## Шаг 4: Сборка релизного APK

```powershell
cd app\android
.\gradlew.bat assembleRelease
```

APK будет в: `app\android\app\build\outputs\apk\release\`

## Шаг 5: Загрузка в RuStore

1. Зарегистрируйтесь в [RuStore Developer Portal](https://dev.rustore.ru/)
2. Создайте новое приложение
3. Загрузите подписанный APK/AAB
4. Заполните описание, категорию, возрастную метку
5. Приложите скриншоты (минимум 2)
6. Отправьте на модерацию

### Требования RuStore:
- Минимальная версия Android: API 21+ (Android 5.0)
- Максимальный размер APK: 150 MB (AAB: 250 MB)
- Иконка: 512x512 px, цветная, 32-bit PNG
- Описание на русском языке
- Возрастная метка: выберите подходящую

## Альтернатива: AAB (Android App Bundle)

Для RuStore рекомендуется AAB (меньший размер загрузки для пользователей):

```powershell
cd app\android
.\gradlew.bat bundleRelease
```

AAB будет в: `app\android\app\build\outputs\bundle\release\`
