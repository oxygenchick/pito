using UnityEngine;
using TMPro;
using Pito.Infrastructure;
using Pito.Tutorial;

namespace Pito.UI
{
    public sealed class AppFlow : MonoBehaviour
    {
        public GameRuntime runtime;
        public TutorialDirector tutorial;
        public GameObject titleScreen, storyScreen, creationScreen, gameScreen, world;
        public UnityEngine.UI.Button startButton, storyNext, creationBack, bornButton;
        public UnityEngine.UI.Button[] colorButtons;
        public TMP_Text startLabel, storyText, storyButtonLabel, dots, balanceLabel, petNameLabel, notice;
        public TMP_InputField nameInput;
        public UnityEngine.UI.Image preview;
        public SpriteRenderer body;
        public GameObject[] titleFaces;
        public FoodMenu food;
        public NeedsView needs;
        public string[] storyPages = {
            "Ты путешествуешь по космосу. На одной из планет ты замечаешь маленькое существо. Оно открывает глаза и улыбается.",
            "В городе тебе рассказывают: это Пито! Встретить его — большая удача.",
            "Пито привязался к тебе. Он ещё многого не знает. Помоги ему освоиться, заботься о нём и учись обращаться со штучками вместе с ним."
        };
        private int storyIndex, colorIndex;
        private bool defaultName = true;
        private float noticeUntil;

        private void Start()
        {
            startButton.onClick.AddListener(() => { if (runtime.Session == null) OpenStory(); else EnterGame(); });
            storyNext.onClick.AddListener(NextStory);
            creationBack.onClick.AddListener(ShowTitle);
            bornButton.onClick.AddListener(Born);
            nameInput.onSelect.AddListener(_ => { if (defaultName) { nameInput.text = ""; defaultName = false; } });
            for (int i = 0; i < colorButtons.Length; i++) { int index = i; colorButtons[i].onClick.AddListener(() => SelectColor(index)); }
            runtime.ProfileChanged += OnProfileChanged;
            int face = Random.Range(0, titleFaces.Length);
            for (int i = 0; i < titleFaces.Length; i++) titleFaces[i].SetActive(i == face);
            ShowTitle();
        }
        private void OnDestroy() { runtime.ProfileChanged -= OnProfileChanged; }
        private void OnProfileChanged() { if (runtime.Session == null) ShowTitle(); }
        private void Switch(GameObject screen)
        {
            titleScreen.SetActive(screen == titleScreen); storyScreen.SetActive(screen == storyScreen);
            creationScreen.SetActive(screen == creationScreen); gameScreen.SetActive(screen == gameScreen);
            world.SetActive(screen == gameScreen);
            if (screen != gameScreen) { tutorial.LeaveGame(); food.Close(); needs.Hide(); }
        }
        public void ShowTitle()
        {
            Switch(titleScreen); startLabel.text = runtime.Session == null ? "Новый Пито" : "Продолжить";
        }
        public void OpenStory() { storyIndex = 0; Switch(storyScreen); RefreshStory(); }
        public void NextStory()
        {
            if (storyIndex < storyPages.Length - 1) { storyIndex++; RefreshStory(); }
            else
            {
                Switch(creationScreen); nameInput.text = "Пито Первый"; defaultName = true; SelectColor(0);
            }
        }
        private void RefreshStory()
        {
            storyText.text = storyPages[storyIndex];
            storyButtonLabel.text = storyIndex == storyPages.Length - 1 ? "Начать" : "Дальше";
            dots.text = string.Join("   ", System.Array.ConvertAll(new[] { 0, 1, 2 }, n => n == storyIndex ? "●" : "○"));
        }
        private void SelectColor(int index)
        {
            colorIndex = index; preview.color = runtime.balance.petColors[index];
            for (int i = 0; i < colorButtons.Length; i++) colorButtons[i].transform.localScale = Vector3.one * (i == index ? 1.12f : 1);
        }
        public void Born() { runtime.CreateProfile(nameInput.text, colorIndex); EnterGame(); }
        public void EnterGame()
        {
            Switch(gameScreen);
            body.color = runtime.balance.petColors[Mathf.Clamp(runtime.Session.Profile.colorIndex, 0, runtime.balance.petColors.Length - 1)];
            petNameLabel.text = runtime.Session.Profile.petName;
            food.Close(); needs.Hide(); tutorial.EnterGame();
        }
        public void TapBackground() { if (!runtime.TutorialActive) { needs.Hide(); food.Close(); } }
        public void ShowNotice(string text) { notice.text = text; noticeUntil = Time.unscaledTime + 3; }
        private void Update()
        {
            if (runtime.Session != null) balanceLabel.text = runtime.Session.Profile.money + "\nштучек";
            if (Time.unscaledTime > noticeUntil) notice.text = runtime.LastStorageError ?? "";
        }
    }
}
