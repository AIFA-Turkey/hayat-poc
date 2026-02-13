export const supportedLocales = ['tr', 'en'];
export const defaultLocale = 'tr';

export const translations = {
  tr: {
    auth: {
      keycloakLoading: 'Keycloak ile kimlik doğrulanıyor...',
      keycloakHint: 'Bu işlem uzun sürerse, tarayıcı konsolundaki hataları kontrol edin.'
    },
    header: {
      dashboard: 'Gösterge Paneli',
      online: 'Çevrimiçi',
      languageSwitch: 'Dil değiştir'
    },
    nav: {
      home: 'Anasayfa',
      communication: 'İletişim',
      patentChat: 'Patent Sohbeti',
      excelChat: 'Excel-Analitik Sohbet',
      agentChat: 'Ajan Bazlı Sohbet',
      fileManagement: 'Kaynak Dosya Yönetimi',
      excelToKb: "Excel'den Bilgi Bankasına",
      excelToDb: "Excel'den Veritabanına",
      configuration: 'Yapılandırma',
      settings: 'Yapılandırma Ayarları',
      resetApiKey: 'API Anahtarını Sıfırla'
    },
    apiKey: {
      welcomeTitle: "Patent GPT'ye Hoş Geldiniz!",
      welcomeSubtitle: 'Devam etmek için hesabınızla giriş yapın.',
      label: 'FlowAI API Anahtarı',
      placeholder: 'sk-...',
      requiredError: 'API anahtarı gerekmektedir',
      submit: 'Panele Giriş',
      tagline: 'Kurumsal Yapay Zeka Çözümleri',
      taglineBrand: 'AIFA Labs',
      taglineDescriptor: 'Kurumsal Yapay Zeka Çözümleri'
    },
    chat: {
      placeholder: 'Bir mesaj yazın...',
      send: 'Gönder',
      serverReply: 'Sunucudan yanıt alındı.',
      responsePreparing: 'Yanıt hazırlanıyor...',
      thinking: 'Düşünüyor...',
      dbQuerying: 'Veritabanı sorgulanıyor...',
      agentWorking: 'Ajan işlem yapıyor...',
      validation: {
        kb: 'Hata: Lütfen önce Yapılandırma Ayarları sayfasında Knowledge Base ID, LM API ID ve Workspace ID değerlerini yapılandırın.',
        t2d: 'Hata: Lütfen önce Yapılandırma Ayarları sayfasında Vendor Account ID ve LM API ID değerlerini yapılandırın.'
      }
    },
    common: {
      fileUpload: 'Dosya Yükleme',
      uploadFile: 'Dosya Yükle',
      uploading: 'Yükleniyor...',
      excelFile: 'Excel Dosyası',
      blobName: 'Blob Adı',
      fileUploadHint: 'Bağlantı dizesi ve container adı Yapılandırma Ayarları sayfasından alınır.',
      uploadFailed: 'Dosya yüklenemedi. Lütfen bağlantı bilgilerini kontrol edin.',
      uploadCompleted: 'Yükleme tamamlandı: {url}',
      exampleFileName: 'ornek.xlsx',
      outputPlaceholder: 'Çıktı burada görünecek',
      errorOccurred: 'Hata Oluştu',
      flowSuccess: 'Akış başarıyla tamamlandı',
      rawResponse: 'İşlenmemiş Yanıt:',
      processing: 'İşleniyor...',
      processingWithStatus: 'İşleniyor ({status})...',
      starting: 'İşlem başlatılıyor...',
      waitingResponse: 'Yanıt bekleniyor...',
      runFlow: 'Akışı Çalıştır',
      configuration: 'Yapılandırma',
      statusOutput: 'Durum ve Çıktı',
      dataPrep: 'Veri Hazırlama',
      titleColumn: 'Başlık Sütunu',
      urlColumn: 'URL Sütunu',
      kbBuilder: 'KB Oluşturucu',
      kbName: 'KB Adı',
      registrationConfig: 'Kayıt Yapılandırması',
      vendorDbName: 'Vendor DB Name',
      uploadExcelOnly: 'Sadece Excel dosyaları yüklenebilir (.xls, .xlsx).',
      selectExcelFile: 'Lütfen önce bir Excel dosyası seçin.',
      blobConfigMissing: 'Blob Storage bağlantı dizesi ve container adını Yapılandırma Ayarları sayfasında tanımlayın.',
      flowStartError: 'İşlem başlatılırken hata oluştu.',
      flowNoHandle: 'İşlem başlatıldı ancak durum takibi için bir kimlik alınamadı.',
      flowTimeout: 'İşlem zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.',
      flowRunError: 'İşlem sırasında hata oluştu.',
      flowStatusError: 'Durum kontrolü sırasında hata oluştu.',
      errorPrefix: 'Hata: {message}'
    },
    home: {
      title: 'Anasayfa',
      subtitle: 'Yeni Kaynak Dosya yükleyin veya Sohbet Tipini seçip hemen başlayın.',
      resourceTitle: 'Kaynak Dosya Yönetimi',
      resourceSubtitle: 'Excel dosyanızı tek sefer yükleyin, iki akışı ayrı ayrı çalıştırın.',
      fileUploadSubtitle: 'Önce Excel dosyanızı aşağıdan yükleyin. Dosya yüklendikten sonra, formu doldurup akışı çalıştırabilirsiniz. Yüklenen dosyanın bağlantı bilgisi otomatik olarak formda kullanılacaktır.',
      chatSectionTitle: 'Sohbetler',
      chatSectionSubtitle: 'Üç sohbet tipinden birini seçin ve hemen başlayın.',
      chatTypes: {
        kb: {
          title: 'Patent Sohbeti',
          description: 'Patent bilgi bankanızla sohbet edin.',
          greeting: 'Merhaba! Bugün Patent araştırmalarınızda nasıl yardımcı olabilirim?'
        },
        t2d: {
          title: 'Excel-Analitik Sohbet',
          description: 'Veritabanı sorularınızı doğal dille sorun.',
          greeting: 'Merhaba! Patent Veritabanınızı sorgulamanıza yardımcı olabilirim. Ne öğrenmek istersiniz?'
        },
        agent: {
          title: 'Ajan Bazlı Sohbet',
          description: 'Yapay Zeka Ajanınız sorunuza en uygun kaynaktan cevap versin',
          greeting: 'Ben Patent Araştırma ajanınızım. Nasıl yardımcı olabilirim?'
        }
      },
      workflows: {
        kb: {
          title: "Excel'den Bilgi Bankasına",
          description: 'Patent Bilgi Bankası oluşturun.'
        },
        db: {
          title: "Excel'den Veritabanına",
          description: 'Patent Veritabanı oluşturun.'
        }
      },
      kbConfigTitle: 'Bilgi Bankası Yapılandırma',
      kbStatusTitle: 'Bilgi Bankası Durum ve Çıktı',
      dbConfigTitle: 'Veritabanı Yapılandırma',
      dbStatusTitle: 'Veritabanı Durum ve Çıktı',
      errors: {
        uploadInProgress: 'Dosya yükleme devam ediyor. Lütfen tamamlanmasını bekleyin.',
        uploadMissing: 'Lütfen önce Excel dosyasını yükleyin.',
        kbConfigMissing: 'Lütfen Yapılandırma Ayarları sayfasında Blob Storage bağlantı dizesi, Doc Intel API Key ve Workspace ID bilgilerini tamamlayın.',
        dbConfigMissing: 'Lütfen Yapılandırma Ayarları sayfasında Blob Storage bağlantı dizesi ve Workspace ID bilgilerini tamamlayın.',
        vendorDbNameMissing: 'Lütfen Vendor DB Name alanını doldurun.'
      }
    },
    settings: {
      title: 'Yapılandırma Ayarları',
      subtitle: 'Sohbet deneyimlerini tek noktadan yönetin',
      cards: {
        flowAi: {
          title: 'FlowAI API Ayarları',
          hintTitle: 'Varsayılan Anahtar',
          hintText: '.env içindeki FlowAI API anahtarı varsayılan olarak kullanılır. Gerekirse buradan farklı bir anahtar tanımlayabilirsiniz.'
        },
        kb: {
          title: 'Patent Sohbeti Ayarları',
          hintTitle: 'Bağlam Bilgisi',
          hintText: "Belirli bilgi bankası bağlamına bağlanmak için ID'leri yapılandırın. Bu, sohbetin doğru veri kaynağını kullanmasını sağlar."
        },
        t2d: {
          title: 'Excel-Analitik Sohbet Ayarları',
          hintTitle: 'Veritabanı Bağlamı',
          hintText: "Geçerli sorgular çalıştırmak için Vendor Account ID'nin veritabanı kaydınızla eşleştiğinden emin olun."
        },
        agent: {
          title: 'Ajan Bazlı Sohbet Ayarları',
          hintTitle: 'İstem Mühendisliği',
          hintText: 'Ajanın kişiliğini ve davranış kısıtlarını burada tanımlayın. Bu istem, her mesajın bağlamına eklenir.'
        },
        blob: {
          title: 'Blob Storage Ayarları',
          hintTitle: 'Blob Depolama',
          hintText: 'Excel yükleme ve indirme adımlarında kullanılacak bağlantı dizesi ve container bilgisini burada saklayın.'
        },
        docIntel: {
          title: 'Azure Document Intelligence Ayarları',
          hintTitle: 'Doküman Analizi',
          hintText: 'Excel’den Bilgi Bankasına akışı için gerekli Azure Document Intelligence kimlik bilgilerini burada yönetin.'
        }
      },
      labels: {
        flowAiApiKey: 'FlowAI API Anahtarı',
        knowledgeBaseId: 'Knowledge Base ID',
        lmApiId: 'LM API ID',
        workspaceId: 'Workspace ID',
        vendorAccountId: 'Vendor Account ID',
        systemPrompt: 'Sistem İstemi',
        connectionString: 'Bağlantı Dizesi',
        containerName: 'Container İsmi',
        endpoint: 'Endpoint',
        apiKey: 'API Anahtarı'
      },
      placeholders: {
        systemPrompt: 'Sen yardımcı bir asistansın...',
        containerName: 'ornek-container',
        endpoint: 'https://...'
      }
    },
    kbChat: {
      title: 'Patent Sohbeti',
      subtitle: 'Patent Bilgi Bankanızla sohbet edin'
    },
    t2dChat: {
      title: 'T2D Sohbeti',
      subtitle: 'Metinden Veritabanına Sorgu Arayüzü',
      rephrasedLabel: 'Yeniden İfade Edilen Soru',
      sqlLabel: 'Oluşturulan SQL'
    },
    agentChat: {
      title: 'Ajan Sohbeti',
      subtitle: 'Yapay Zeka Ajanınız sorunuza en uygun kaynaktan cevap versin',
      configTitle: 'Ajan Yapılandırması',
      systemPromptPlaceholder: 'Sen yardımcı bir asistansın...',
      promptHintTitle: 'İstem Mühendisliği',
      promptHintText: 'Ajanın kişiliğini ve davranış kısıtlarını burada tanımlayın. Bu istem, her mesajın bağlamına eklenir.'
    },
    excelToKb: {
      title: "Excel'den Bilgi Bankasına",
      subtitle: 'Excel dosyalarını işleyip Patent GPT Bilgi Bankası oluşturun',
      validationError: 'Lütfen çalıştırmadan önce Blob Storage bağlantı dizesini girin ve Excel dosyasını yükleyin (Doc Intel API Key ve Workspace ID de gereklidir).',
      waitingResponse: 'Cerebro yanıtı bekleniyor...'
    },
    excelToDb: {
      title: "Excel'den DB'ye",
      subtitle: 'Excel dosyalarını işleyip Patent GPT Veritabanına kaydedin',
      validationError: 'Lütfen çalıştırmadan önce Excel dosyasını yükleyin ve Vendor DB Adı girin (Workspace ID Yapılandırma Ayarlarından alınır).',
      waitingResponse: 'Patent GPT yanıtı bekleniyor...'
    },
    errorBoundary: {
      title: 'Bir şeyler yanlış gitti.',
      subtitle: 'Uygulama aşağıdaki hatayı üretti:'
    },
    api: {
      httpError: 'HTTP hatası! durum: {status}',
      errorAfter: '{message} ({elapsed} sonra)',
      timeout: 'Zaman aşımı: API isteği {elapsed} sonra zaman aşımına uğradı (AbortController). Lütfen tekrar deneyin.',
      networkError: 'Ağ Hatası: {elapsed} sonra bağlantı kesildi. Bu Vite proxy zaman aşımı, CORS sorunu veya ağ bağlantı problemi olabilir.'
    }
  },
  en: {
    auth: {
      keycloakLoading: 'Authenticating with Keycloak...',
      keycloakHint: 'If this takes too long, check errors in the browser console.'
    },
    header: {
      dashboard: 'Dashboard',
      online: 'Online',
      languageSwitch: 'Switch language'
    },
    nav: {
      home: 'Home',
      communication: 'Communication',
      patentChat: 'Patent Chat',
      excelChat: 'Excel Analytics Chat',
      agentChat: 'Agent Chat',
      fileManagement: 'Source File Management',
      excelToKb: 'Excel to Knowledge Base',
      excelToDb: 'Excel to Database',
      configuration: 'Configuration',
      settings: 'Configuration Settings',
      resetApiKey: 'Reset API Key'
    },
    apiKey: {
      welcomeTitle: 'Welcome to Patent GPT!',
      welcomeSubtitle: 'Enter your FlowAI API Key to continue.',
      label: 'FlowAI API Key',
      placeholder: 'sk-...',
      requiredError: 'API key is required',
      submit: 'Sign In',
      tagline: 'Enterprise AI Solutions',
      taglineBrand: 'AIFA Labs',
      taglineDescriptor: 'Enterprise AI Solutions'
    },
    chat: {
      placeholder: 'Type a message...',
      send: 'Send',
      serverReply: 'Server response received.',
      responsePreparing: 'Preparing response...',
      thinking: 'Thinking...',
      dbQuerying: 'Querying database...',
      agentWorking: 'Agent is working...',
      validation: {
        kb: 'Error: Please configure the Knowledge Base ID, LM API ID, and Workspace ID in Configuration Settings first.',
        t2d: 'Error: Please configure the Vendor Account ID and LM API ID in Configuration Settings first.'
      }
    },
    common: {
      fileUpload: 'File Upload',
      uploadFile: 'Upload File',
      uploading: 'Uploading...',
      excelFile: 'Excel File',
      blobName: 'Blob Name',
      fileUploadHint: 'Connection string and container name are taken from the Configuration Settings page.',
      uploadFailed: 'File upload failed. Please check the connection details.',
      uploadCompleted: 'Upload complete: {url}',
      exampleFileName: 'example.xlsx',
      outputPlaceholder: 'Output will appear here',
      errorOccurred: 'An Error Occurred',
      flowSuccess: 'Flow completed successfully',
      rawResponse: 'Raw Response:',
      processing: 'Processing...',
      processingWithStatus: 'Processing ({status})...',
      starting: 'Starting process...',
      waitingResponse: 'Waiting for response...',
      runFlow: 'Run Flow',
      configuration: 'Configuration',
      statusOutput: 'Status & Output',
      dataPrep: 'Data Preparation',
      titleColumn: 'Title Column',
      urlColumn: 'URL Column',
      kbBuilder: 'KB Builder',
      kbName: 'KB Name',
      registrationConfig: 'Registration Configuration',
      vendorDbName: 'Vendor DB Name',
      uploadExcelOnly: 'Only Excel files can be uploaded (.xls, .xlsx).',
      selectExcelFile: 'Please select an Excel file first.',
      blobConfigMissing: 'Define the Blob Storage connection string and container name in Configuration Settings.',
      flowStartError: 'An error occurred while starting the process.',
      flowNoHandle: 'The process started but no tracking identifier was returned.',
      flowTimeout: 'The process timed out. Please try again later.',
      flowRunError: 'An error occurred during processing.',
      flowStatusError: 'An error occurred while checking status.',
      errorPrefix: 'Error: {message}'
    },
    home: {
      title: 'Home',
      subtitle: 'Choose source file management or a chat type to get started.',
      resourceTitle: 'Source File Management',
      resourceSubtitle: 'Upload your Excel file once and run two flows separately.',
      fileUploadSubtitle: 'First upload your Excel file below. After the file is uploaded, fill in the form and run the flow. The uploaded file connection info will be used automatically in the form.',
      chatSectionTitle: 'Chats',
      chatSectionSubtitle: 'Pick one of three chat types and get started right away.',
      chatTypes: {
        kb: {
          title: 'Patent Chat',
          description: 'Chat with your patent knowledge base.',
          greeting: 'Hello! How can I help with your patent research today?'
        },
        t2d: {
          title: 'Excel Analytics Chat',
          description: 'Ask your database questions in natural language.',
          greeting: 'Hello! I can help query your patent database. What would you like to know?'
        },
        agent: {
          title: 'Agent Chat',
          description: 'Let your AI agent answer from the most relevant source.',
          greeting: 'I am your patent research agent. How can I help?'
        }
      },
      workflows: {
        kb: {
          title: 'Excel to Knowledge Base',
          description: 'Create a patent knowledge base.'
        },
        db: {
          title: 'Excel to Database',
          description: 'Create a patent database.'
        }
      },
      kbConfigTitle: 'Knowledge Base Configuration',
      kbStatusTitle: 'Knowledge Base Status & Output',
      dbConfigTitle: 'Database Configuration',
      dbStatusTitle: 'Database Status & Output',
      errors: {
        uploadInProgress: 'File upload is in progress. Please wait for it to finish.',
        uploadMissing: 'Please upload the Excel file first.',
        kbConfigMissing: 'Please complete the Blob Storage connection string, Doc Intel API Key, and Workspace ID in Configuration Settings.',
        dbConfigMissing: 'Please complete the Blob Storage connection string and Workspace ID in Configuration Settings.',
        vendorDbNameMissing: 'Please fill in the Vendor DB Name field.'
      }
    },
    settings: {
      title: 'Configuration Settings',
      subtitle: 'Manage chat experiences from a single place',
      cards: {
        flowAi: {
          title: 'FlowAI API Settings',
          hintTitle: 'Default Key',
          hintText: 'The FlowAI API key from .env is used by default. Override it here when needed.'
        },
        kb: {
          title: 'Patent Chat Settings',
          hintTitle: 'Context Info',
          hintText: 'Configure the IDs to connect to a specific knowledge base context. This ensures the chat uses the correct data source.'
        },
        t2d: {
          title: 'Excel Analytics Chat Settings',
          hintTitle: 'Database Context',
          hintText: 'Ensure the Vendor Account ID matches your database record to run valid queries.'
        },
        agent: {
          title: 'Agent Chat Settings',
          hintTitle: 'Prompt Engineering',
          hintText: "Define the agent's personality and behavior constraints here. This prompt is appended to every message context."
        },
        blob: {
          title: 'Blob Storage Settings',
          hintTitle: 'Blob Storage',
          hintText: 'Store the connection string and container information used for Excel uploads and downloads here.'
        },
        docIntel: {
          title: 'Azure Document Intelligence Settings',
          hintTitle: 'Document Analysis',
          hintText: 'Manage the Azure Document Intelligence credentials required for the Excel to Knowledge Base flow here.'
        }
      },
      labels: {
        flowAiApiKey: 'FlowAI API Key',
        knowledgeBaseId: 'Knowledge Base ID',
        lmApiId: 'LM API ID',
        workspaceId: 'Workspace ID',
        vendorAccountId: 'Vendor Account ID',
        systemPrompt: 'System Prompt',
        connectionString: 'Connection String',
        containerName: 'Container Name',
        endpoint: 'Endpoint',
        apiKey: 'API Key'
      },
      placeholders: {
        systemPrompt: 'You are a helpful assistant...',
        containerName: 'example-container',
        endpoint: 'https://...'
      }
    },
    kbChat: {
      title: 'Patent Chat',
      subtitle: 'Chat with your patent knowledge base'
    },
    t2dChat: {
      title: 'T2D Chat',
      subtitle: 'Text-to-Database Query Interface',
      rephrasedLabel: 'Rephrased Question',
      sqlLabel: 'Generated SQL'
    },
    agentChat: {
      title: 'Agent Chat',
      subtitle: 'Let your AI agent answer from the most relevant source',
      configTitle: 'Agent Configuration',
      systemPromptPlaceholder: 'You are a helpful assistant...',
      promptHintTitle: 'Prompt Engineering',
      promptHintText: "Define the agent's personality and behavior constraints here. This prompt is appended to every message context."
    },
    excelToKb: {
      title: 'Excel to Knowledge Base',
      subtitle: 'Process Excel files and create a Patent GPT knowledge base',
      validationError: 'Before running, enter the Blob Storage connection string and upload the Excel file (Doc Intel API Key and Workspace ID are also required).',
      waitingResponse: 'Waiting for Cerebro response...'
    },
    excelToDb: {
      title: 'Excel to DB',
      subtitle: 'Process Excel files and save them to the Patent GPT database',
      validationError: 'Before running, upload the Excel file and enter the Vendor DB Name (Workspace ID is taken from Configuration Settings).',
      waitingResponse: 'Waiting for Patent GPT response...'
    },
    errorBoundary: {
      title: 'Something went wrong.',
      subtitle: 'The application produced the following error:'
    },
    api: {
      httpError: 'HTTP error! status: {status}',
      errorAfter: '{message} (after {elapsed})',
      timeout: 'Timeout: API request timed out after {elapsed} (AbortController). Please try again.',
      networkError: 'Network Error: connection dropped after {elapsed}. This may be a Vite proxy timeout, a CORS issue, or a network problem.'
    }
  }
};
