using System;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using TMPro;
using Pito.Configuration;
using Pito.Infrastructure;
using Pito.UI;
using Pito.Pet;
using Pito.Tutorial;

namespace Pito.EditorTools
{
    // Editor-only authoring tool. Produces ordinary, editable scene objects and assets;
    // the player never generates its UI hierarchy at runtime.
    public static class PrototypeBuilder
    {
        private const string Root = "Assets/Pito";
        private static readonly Color Ink = new Color(.16f,.17f,.26f);
        private static readonly Color Paper = new Color(.97f,.95f,.90f);
        private static readonly Color Violet = new Color(.59f,.42f,.73f);
        private static TMP_FontAsset font;
        private static Sprite round, petSprite;
        private static TransitionProfile transition;

        [MenuItem("Pito/Create initial prototype")]
        public static void Build()
        {
            const string scenePath = Root + "/Scenes/PitoPrototype.unity";
            if (File.Exists(scenePath)) throw new InvalidOperationException("Prototype already exists. Edit the scene; rebuilding would overwrite your changes.");
            if (SceneManager.GetActiveScene().isDirty) throw new InvalidOperationException("Save the current scene first.");
            Folder(Root + "/Scenes"); Folder(Root + "/Art/Placeholders"); Folder(Root + "/Settings");
            Folder(Root + "/UI/Prefabs"); Folder(Root + "/Fonts");
            round = MakeSprite("Circle", (x,y) => x*x + y*y < 1);
            petSprite = MakeSprite("PetBody", (x,y) => x*x + y*y < 1 && y > -.72f);
            var sourceFont = AssetDatabase.LoadAssetAtPath<Font>("Assets/TextMesh Pro/Fonts/LiberationSans.ttf");
            if (sourceFont == null) throw new InvalidOperationException("Import TMP Essentials before building.");
            font = TMP_FontAsset.CreateFontAsset(sourceFont, 80, 8, UnityEngine.TextCore.LowLevel.GlyphRenderMode.SDFAA,
                1024, 1024, AtlasPopulationMode.Dynamic, false);
            font.name = "Pito Cyrillic";
            AssetDatabase.CreateAsset(font, Root + "/Fonts/PitoCyrillic.asset");
            font.TryAddCharacters(string.Concat(Enumerable.Range(32,95).Concat(Enumerable.Range(0x400,256))
                .Concat(new[] { 0x2190,0x2191,0x2192,0x2193,0x2022,0x25CF,0x25CB,0x00D7,0x2014 }).Select(c => (char)c)));
            foreach (var atlas in font.atlasTextures) AssetDatabase.AddObjectToAsset(atlas, font);
            AssetDatabase.AddObjectToAsset(font.material, font);
            // Dynamic population supports user-entered names. Known UI characters are prewarmed.
            var balance = ScriptableObject.CreateInstance<GameBalance>();
            AssetDatabase.CreateAsset(balance, Root + "/Settings/GameBalance.asset");
            transition = ScriptableObject.CreateInstance<TransitionProfile>();
            AssetDatabase.CreateAsset(transition, Root + "/Settings/PanelTransition.asset");
            var catalog = ScriptableObject.CreateInstance<FoodCatalog>();
            string[] titles = { "Яблоко", "Каша", "Суп", "Морковь", "Сыр", "Бутерброд", "Груша", "Рагу", "Тыква", "Ягоды" };
            catalog.items = titles.Select((name,i) => new FoodDefinition { id = "food_" + i, title = name,
                price = 3 + i * 2, satiety = 15 + i * 6, icon = round }).ToArray();
            AssetDatabase.CreateAsset(catalog, Root + "/Settings/FoodCatalog.asset");

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var cam = new GameObject("Main Camera", typeof(Camera), typeof(Physics2DRaycaster)).GetComponent<Camera>();
            cam.tag = "MainCamera"; cam.orthographic = true; cam.orthographicSize = 8;
            cam.transform.position = new Vector3(0,0,-10); cam.backgroundColor = Paper;
            cam.clearFlags = CameraClearFlags.SolidColor;
            new GameObject("EventSystem", typeof(EventSystem), typeof(InputSystemUIInputModule));
            var services = new GameObject("PitoApplication");
            var runtime = services.AddComponent<GameRuntime>(); runtime.balance = balance;
            var app = services.AddComponent<AppFlow>(); app.runtime = runtime;
            var tutorial = services.AddComponent<TutorialDirector>(); tutorial.runtime = runtime; app.tutorial = tutorial;
            var debug = services.AddComponent<DebugMenu>(); debug.runtime = runtime; debug.tutorial = tutorial;
            var canvasGo = new GameObject("Interface", typeof(RectTransform), typeof(Canvas), typeof(UnityEngine.UI.CanvasScaler), typeof(UnityEngine.UI.GraphicRaycaster));
            var canvas = canvasGo.GetComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGo.GetComponent<UnityEngine.UI.CanvasScaler>();
            scaler.uiScaleMode = UnityEngine.UI.CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(540,960); scaler.matchWidthOrHeight = .5f;
            var safe = Rect("SafeArea", canvasGo.transform, Vector2.zero, Vector2.one); safe.gameObject.AddComponent<SafeAreaView>();
            app.titleScreen = Screen("Title", safe);
            app.storyScreen = Screen("Story", safe);
            app.creationScreen = Screen("CreatePet", safe);
            app.gameScreen = Rect("Game", safe, Vector2.zero, Vector2.one).gameObject;

            Label("Logo", app.titleScreen.transform, "пито", .15f,.79f,.85f,.94f,78);
            Label("Slogan", app.titleScreen.transform, "Маленький друг.\nБольшие открытия.", .1f,.67f,.9f,.78f,27);
            var faceRoot = Rect("RandomFace", app.titleScreen.transform, new Vector2(.18f,.30f), new Vector2(.82f,.63f));
            app.titleFaces = new GameObject[3];
            for (int i = 0; i < 3; i++)
            {
                var face = Rect("Face" + i, faceRoot, Vector2.zero, Vector2.one);
                MakeFace(face, i); app.titleFaces[i] = face.gameObject;
            }
            app.startButton = Button("Start", app.titleScreen.transform, "Новый Пито", .12f,.10f,.88f,.19f,Violet);
            app.startLabel = app.startButton.GetComponentInChildren<TMP_Text>();
            Label("Footer", app.titleScreen.transform, "Финансовый дружище", .15f,.03f,.85f,.075f,20);

            var storyCard = Image("StoryCard", app.storyScreen.transform, .08f,.59f,.92f,.88f,Color.white);
            app.storyText = Label("StoryText", storyCard.transform, "История", .07f,.08f,.93f,.92f,26);
            app.dots = Label("PageDots", app.storyScreen.transform, "●   ○   ○", .25f,.52f,.75f,.58f,26);
            PetImage(app.storyScreen.transform, .25f,.26f,.75f,.47f,Violet);
            Label("Bubble", app.storyScreen.transform, "Пито?", .49f,.44f,.82f,.51f,27);
            app.storyNext = Button("Next", app.storyScreen.transform, "Дальше", .12f,.09f,.88f,.18f,Violet);
            app.storyButtonLabel = app.storyNext.GetComponentInChildren<TMP_Text>();

            app.creationBack = Button("BackToTitle", app.creationScreen.transform, "←", .03f,.90f,.17f,.975f,new Color(.88f,.86f,.94f));
            Label("CreateTitle", app.creationScreen.transform, "Знакомься, твой Пито", .18f,.89f,.85f,.96f,25);
            var inputRoot = Image("PetName", app.creationScreen.transform, .10f,.75f,.90f,.84f,Color.white,true);
            app.nameInput = inputRoot.gameObject.AddComponent<TMP_InputField>();
            var textRect = Rect("TextArea", inputRoot.transform, new Vector2(.04f,.08f), new Vector2(.96f,.92f));
            var inputText = Label("Text", textRect, "Пито Первый", 0,0,1,1,28);
            app.nameInput.textViewport = textRect; app.nameInput.textComponent = inputText;
            app.nameInput.targetGraphic = inputRoot; app.nameInput.characterLimit = 24;
            app.nameInput.richText = false;
            Label("NameHint", app.creationScreen.transform, "Назови своего Пито", .1f,.69f,.9f,.75f,22);
            app.preview = PetImage(app.creationScreen.transform, .25f,.38f,.75f,.58f,Violet);
            Label("Sleep", app.creationScreen.transform, "z Z", .57f,.56f,.79f,.64f,25);
            app.colorButtons = new UnityEngine.UI.Button[balance.petColors.Length];
            for (int i=0;i<app.colorButtons.Length;i++)
            {
                app.colorButtons[i] = Button("Color" + i, app.creationScreen.transform,"", .14f+i*.19f,.24f,.27f+i*.19f,.315f,balance.petColors[i]);
                app.colorButtons[i].image.sprite = round;
            }
            Label("ColorHint", app.creationScreen.transform,"Выбери цвет",.15f,.18f,.85f,.23f,22);
            app.bornButton = Button("Born",app.creationScreen.transform,"Родиться",.12f,.07f,.88f,.16f,Violet);

            var world = new GameObject("Meadow"); app.world = world;
            var floor = new GameObject("Lawn",typeof(SpriteRenderer),typeof(BoxCollider2D),typeof(BackgroundTap));
            floor.transform.SetParent(world.transform); floor.transform.position = new Vector3(0,-4,2);
            floor.transform.localScale = new Vector3(30,10,1);
            var lawn = floor.GetComponent<SpriteRenderer>(); lawn.sprite = round; lawn.color = new Color(.78f,.84f,.66f); lawn.sortingOrder = -10;
            UnityEditor.Events.UnityEventTools.AddPersistentListener(floor.GetComponent<BackgroundTap>().onTap,app.TapBackground);
            var background = new GameObject("BackgroundHitArea",typeof(BoxCollider2D),typeof(BackgroundTap));
            background.transform.SetParent(world.transform); background.transform.position = new Vector3(0,0,3);
            background.GetComponent<BoxCollider2D>().size = new Vector2(100,100);
            UnityEditor.Events.UnityEventTools.AddPersistentListener(background.GetComponent<BackgroundTap>().onTap,app.TapBackground);
            var pet = new GameObject("Pito",typeof(SpriteRenderer),typeof(CircleCollider2D),typeof(PetInteraction));
            pet.transform.SetParent(world.transform); pet.transform.position = new Vector3(0,-2.2f,0); pet.transform.localScale = new Vector3(3,2.7f,1);
            app.body = pet.GetComponent<SpriteRenderer>(); app.body.sprite = petSprite; app.body.color = Violet;
            pet.GetComponent<CircleCollider2D>().radius = .49f;
            var interaction = pet.GetComponent<PetInteraction>(); interaction.runtime = runtime; interaction.uiCanvas = canvas;
            for (int i=0;i<2;i++)
            {
                var eye = new GameObject("Eye" + i,typeof(SpriteRenderer)); eye.transform.SetParent(pet.transform,false);
                eye.transform.localPosition = new Vector3(i==0?-.15f:.15f,.03f,-.05f); eye.transform.localScale = new Vector3(.065f,.13f,1);
                var eyeRenderer = eye.GetComponent<SpriteRenderer>(); eyeRenderer.sprite = round; eyeRenderer.color = Ink; eyeRenderer.sortingOrder = 1;
            }
            app.petNameLabel = Label("PetName",app.gameScreen.transform,"Пито",.18f,.18f,.82f,.24f,30);
            app.notice = Label("Notice",app.gameScreen.transform,"",.08f,.08f,.92f,.16f,23);
            var hud = Rect("TopBar", app.gameScreen.transform,new Vector2(.07f,.82f),new Vector2(.93f,.93f));
            var feed = Button("Food",hud,"Еда",0,0,.27f,1,Color.white); feed.image.sprite = round;
            var wallet = Button("Wallet",hud,"30\nштучек",.34f,0,.66f,1,Color.white); wallet.image.sprite = round;
            app.balanceLabel = wallet.GetComponentInChildren<TMP_Text>();
            var wash = Button("Wash",hud,"Мыть",.73f,0,1,1,Color.white); wash.image.sprite = round;
            UnityEditor.Events.UnityEventTools.AddStringPersistentListener(wallet.onClick,app.ShowNotice,"Это твои штучки — игровая валюта.");
            UnityEditor.Events.UnityEventTools.AddStringPersistentListener(wash.onClick,app.ShowNotice,"Мытьё добавим на следующем этапе.");
            tutorial.hud = hud.gameObject; tutorial.pet = interaction; tutorial.foodButton = (RectTransform)feed.transform;

            var needRoot = Rect("Needs",app.gameScreen.transform,new Vector2(.10f,.44f),new Vector2(.90f,.60f));
            var needs = needRoot.gameObject.AddComponent<NeedsView>(); app.needs = needs; tutorial.needs = needs;
            needs.runtime = runtime; needs.panel = Panel(needRoot); needs.rings = new UnityEngine.UI.Image[3]; needs.values = new TMP_Text[3];
            string[] needNames = { "Ласка", "Сытость", "Чистота" };
            for (int i=0;i<3;i++)
            {
                float x = i*.345f;
                var circle = Image(needNames[i],needRoot,x,.24f,x+.31f,.98f,new Color(.87f,.85f,.88f)); circle.sprite = round;
                var ring = Image("Fill",circle.transform,0,0,1,1,Violet); ring.sprite = round;
                ring.type = UnityEngine.UI.Image.Type.Filled; ring.fillMethod = UnityEngine.UI.Image.FillMethod.Radial360;
                ring.fillOrigin = 2; ring.fillAmount = .5f; needs.rings[i] = ring;
                Image("Inner",circle.transform,.12f,.12f,.88f,.88f,Paper).sprite = round;
                needs.values[i] = Label("Value",circle.transform,"50%",.1f,.2f,.9f,.8f,23);
                Label("Label",needRoot,needNames[i],x,0,x+.31f,.23f,20);
            }
            var foodRoot = Image("FoodMenu",app.gameScreen.transform,.025f,.64f,.975f,.80f,Color.white,true);
            var food = services.AddComponent<FoodMenu>(); app.food = food; tutorial.food = food;
            food.runtime = runtime; food.catalog = catalog; food.needs = needs; food.menu = Panel((RectTransform)foodRoot.transform);
            tutorial.foodMenuArea = (RectTransform)foodRoot.transform;
            UnityEditor.Events.UnityEventTools.AddPersistentListener(feed.onClick,food.Toggle);
            food.previous = Button("Previous",foodRoot.transform,"←",0,.32f,.12f,.96f,Paper);
            food.next = Button("Next",foodRoot.transform,"→",.88f,.32f,1,.96f,Paper);
            food.pageLabel = Label("Page",foodRoot.transform,"1 / 3",.36f,0,.64f,.22f,17);
            food.cards = new UnityEngine.UI.Button[4]; food.cardLabels = new TMP_Text[4]; food.cardIcons = new UnityEngine.UI.Image[4];
            for(int i=0;i<4;i++)
            {
                float x=.12f+i*.19f;
                food.cards[i]=Button("FoodSlot"+i,foodRoot.transform,"Еда",x,.22f,x+.18f,.96f,Paper);
                food.cardLabels[i]=food.cards[i].GetComponentInChildren<TMP_Text>();
                var r=food.cardLabels[i].rectTransform; r.anchorMin=new Vector2(0,0); r.anchorMax=new Vector2(1,.48f);
                food.cardLabels[i].fontSize=17;
                food.cardIcons[i]=Image("Icon",food.cards[i].transform,.25f,.53f,.75f,.93f,new Color(.91f,.66f,.44f));
                food.cardIcons[i].sprite=round;
            }
            var modal = Image("FoodConfirmation",safe,0,0,1,1,new Color(.13f,.12f,.20f,.3f),true);
            food.popup=Panel((RectTransform)modal.transform);
            var confirmation=Image("Card",modal.transform,.08f,.23f,.92f,.76f,Paper,true);
            tutorial.confirmationArea=(RectTransform)confirmation.transform;
            food.selectedIcon=Image("FoodIcon",confirmation.transform,.35f,.70f,.65f,.91f,new Color(.91f,.66f,.44f)); food.selectedIcon.sprite=round;
            food.question=Label("Question",confirmation.transform,"",.06f,.28f,.94f,.69f,24);
            food.confirm=Button("ConfirmFeed",confirmation.transform,"Покормить",.07f,.13f,.93f,.27f,Violet);
            food.cancel=Button("Cancel",confirmation.transform,"Назад",.07f,.015f,.93f,.12f,new Color(.88f,.86f,.94f));

            var overlayImage=Image("TutorialOverlay",safe,0,0,1,1,new Color(0,0,0,.025f),true);
            var overlay=overlayImage.gameObject.AddComponent<TutorialOverlay>(); overlay.worldCamera=cam; tutorial.overlay=overlay;
            var tip=Image("Tip",overlay.transform,.07f,.05f,.93f,.22f,Color.white,false);
            tutorial.message=Label("Message",tip.transform,"",.05f,.06f,.95f,.94f,23);
            tutorial.arrow=Label("Arrow",overlay.transform,"↓",.07f,.72f,.20f,.81f,38);
            var hand=Image("PettingHand",safe,0,0,0,0,new Color(1,.88f,.68f));
            hand.sprite=round; var handRect=(RectTransform)hand.transform; handRect.anchorMin=handRect.anchorMax=new Vector2(.5f,.5f); handRect.sizeDelta=new Vector2(66,82);
            Label("HandLabel",hand.transform,"Ласка",0,0,1,1,16); interaction.hand=handRect; hand.gameObject.SetActive(false);

            BuildDebug(safe,debug);
            var debugTrigger=Image("DebugHoldCorner",safe,.87f,.94f,1,1,new Color(.3f,.3f,.4f,.07f),true);
            Label("Mark",debugTrigger.transform,"···",0,0,1,1,21);
            UnityEditor.Events.UnityEventTools.AddPersistentListener(debugTrigger.gameObject.AddComponent<LongPressTrigger>().onLongPress,debug.Open);

            // Reusable styles are separate prefab assets, not a single mandatory button appearance.
            var primary = Button("PrimaryButton",safe,"Кнопка",.1f,.1f,.9f,.2f,Violet);
            PrefabUtility.SaveAsPrefabAsset(primary.gameObject,Root+"/UI/Prefabs/PrimaryButton.prefab"); UnityEngine.Object.DestroyImmediate(primary.gameObject);
            var secondary=Button("SecondaryButton",safe,"Кнопка",.1f,.1f,.9f,.2f,Paper);
            PrefabUtility.SaveAsPrefabAsset(secondary.gameObject,Root+"/UI/Prefabs/SecondaryButton.prefab"); UnityEngine.Object.DestroyImmediate(secondary.gameObject);
            var icon=Button("IconButton",safe,"Иконка",.1f,.1f,.25f,.19f,Color.white); icon.image.sprite=round;
            PrefabUtility.SaveAsPrefabAsset(icon.gameObject,Root+"/UI/Prefabs/IconButton.prefab"); UnityEngine.Object.DestroyImmediate(icon.gameObject);

            app.storyScreen.SetActive(false); app.creationScreen.SetActive(false); app.gameScreen.SetActive(false); world.SetActive(false);
            overlay.gameObject.SetActive(false);
            PlayerSettings.defaultInterfaceOrientation=UIOrientation.Portrait;
            PlayerSettings.defaultScreenWidth=540; PlayerSettings.defaultScreenHeight=960;
            PlayerSettings.runInBackground=false;
            EditorSceneManager.SaveScene(scene,scenePath);
            var otherScenes=EditorBuildSettings.scenes.Where(s=>s.path!=scenePath).Select(s=>new EditorBuildSettingsScene(s.path,false));
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(scenePath,true)}.Concat(otherScenes).ToArray();
            AssetDatabase.SaveAssets();
            Selection.activeGameObject=services;
        }

        private static void BuildDebug(Transform parent,DebugMenu debug)
        {
            var root=Image("DebugMenu",parent,0,0,1,1,new Color(.94f,.94f,.94f),true); debug.panel=Panel((RectTransform)root.transform);
            debug.status=Label("Status",root.transform,"Отладка",.06f,.70f,.94f,.92f,22);
            debug.speedButtons=new UnityEngine.UI.Button[5];
            for(int i=0;i<5;i++) debug.speedButtons[i]=Button("Speed"+i,root.transform,"×"+debug.speeds[i],.04f+i*.19f,.60f,.215f+i*.19f,.69f,Color.white);
            debug.absence=Button("Absence",root.transform,"Симулировать час отсутствия",.06f,.48f,.94f,.57f,Color.white);
            debug.hunger=Button("ReduceSatiety",root.transform,"Сытость −25",.06f,.37f,.94f,.46f,Color.white);
            debug.skipTutorial=Button("Tutorial",root.transform,"Включить / выключить обучение",.06f,.26f,.94f,.35f,Color.white);
            debug.reset=Button("Reset",root.transform,"Сбросить приложение",.06f,.15f,.94f,.24f,new Color(1,.79f,.76f));
            debug.resetLabel=debug.reset.GetComponentInChildren<TMP_Text>(); debug.resetLabel.fontSize=21;
            debug.close=Button("Close",root.transform,"Закрыть",.06f,.04f,.94f,.13f,Color.white);
        }

        private static void Folder(string path)
        {
            if(AssetDatabase.IsValidFolder(path))return;
            var parent=Path.GetDirectoryName(path).Replace('\\','/'); Folder(parent); AssetDatabase.CreateFolder(parent,Path.GetFileName(path));
        }
        private static Sprite MakeSprite(string name,Func<float,float,bool> contains)
        {
            string path=Root+"/Art/Placeholders/"+name+".png";
            var tex=new Texture2D(128,128,TextureFormat.RGBA32,false);
            var pixels=new Color[128*128];
            for(int y=0;y<128;y++)for(int x=0;x<128;x++)pixels[y*128+x]=contains((x-63.5f)/63.5f,(y-63.5f)/63.5f)?Color.white:Color.clear;
            tex.SetPixels(pixels); tex.Apply(); File.WriteAllBytes(path,tex.EncodeToPNG()); UnityEngine.Object.DestroyImmediate(tex);
            AssetDatabase.ImportAsset(path);
            var importer=(TextureImporter)AssetImporter.GetAtPath(path); importer.textureType=TextureImporterType.Sprite;
            importer.spritePixelsPerUnit=128; importer.alphaIsTransparency=true; importer.mipmapEnabled=false; importer.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Sprite>(path);
        }
        private static RectTransform Rect(string name,Transform parent,Vector2 min,Vector2 max)
        {
            var r=new GameObject(name,typeof(RectTransform)).GetComponent<RectTransform>(); r.SetParent(parent,false);
            r.anchorMin=min;r.anchorMax=max;r.offsetMin=r.offsetMax=Vector2.zero;return r;
        }
        private static UnityEngine.UI.Image Image(string name,Transform parent,float x0,float y0,float x1,float y1,Color color,bool raycast=false)
        {
            var r=Rect(name,parent,new Vector2(x0,y0),new Vector2(x1,y1));var image=r.gameObject.AddComponent<UnityEngine.UI.Image>();
            image.color=color; image.raycastTarget=raycast;return image;
        }
        private static TMP_Text Label(string name,Transform parent,string text,float x0,float y0,float x1,float y1,float size)
        {
            var r=Rect(name,parent,new Vector2(x0,y0),new Vector2(x1,y1));var label=r.gameObject.AddComponent<TextMeshProUGUI>();
            label.font=font;label.text=text;label.fontSize=size;label.color=Ink;label.alignment=TextAlignmentOptions.Center;
            label.raycastTarget=false;label.richText=false;return label;
        }
        private static UnityEngine.UI.Button Button(string name,Transform parent,string text,float x0,float y0,float x1,float y1,Color color)
        {
            var image=Image(name,parent,x0,y0,x1,y1,color,true);var b=image.gameObject.AddComponent<UnityEngine.UI.Button>(); b.targetGraphic=image;
            var label=Label("Label",image.transform,text,.03f,.04f,.97f,.96f,25); if(color==Violet)label.color=Color.white;
            var navigation=b.navigation; navigation.mode=UnityEngine.UI.Navigation.Mode.None;b.navigation=navigation;return b;
        }
        private static PanelView Panel(RectTransform rect)
        {
            var panel=rect.gameObject.AddComponent<PanelView>();panel.transition=transition;panel.initiallyVisible=false;
            var group=rect.GetComponent<CanvasGroup>();group.alpha=0;group.blocksRaycasts=false;group.interactable=false;return panel;
        }
        private static GameObject Screen(string name,Transform parent)=>Image(name,parent,0,0,1,1,Paper).gameObject;
        private static UnityEngine.UI.Image PetImage(Transform parent,float x0,float y0,float x1,float y1,Color color)
        {
            var body=Image("PetPreview",parent,x0,y0,x1,y1,color);body.sprite=petSprite;MakeFace(body.transform,0);return body;
        }
        private static void MakeFace(Transform parent,int variation)
        {
            Image("LeftEye",parent,.28f,.46f,.36f,.66f,Ink).sprite=round;
            Image("RightEye",parent,.64f,.46f,.72f,.66f,Ink).sprite=round;
            Label("Mouth",parent,variation==0?"u":variation==1?"o":"~",.35f,.14f,.65f,.42f,40);
        }
    }
}
