using UnityEngine;
using TMPro;
using Pito.Core;
using Pito.Infrastructure;
using Pito.Tutorial;

namespace Pito.UI
{
    public sealed class DebugMenu : MonoBehaviour
    {
        public GameRuntime runtime;
        public TutorialDirector tutorial;
        public PanelView panel;
        public TMP_Text status, resetLabel;
        public UnityEngine.UI.Button[] speedButtons;
        public float[] speeds = { 0, 1, 60, 144, 3600 };
        public UnityEngine.UI.Button reset, close, skipTutorial, absence, hunger;
        private bool confirmReset;
        public void Open() { confirmReset = false; resetLabel.text = "Сбросить приложение"; panel.Show(); }
        private void Start()
        {
            for (int i = 0; i < speedButtons.Length; i++) { float speed = speeds[i]; speedButtons[i].onClick.AddListener(() => runtime.SetTimeMultiplier(speed)); }
            close.onClick.AddListener(panel.Hide);
            reset.onClick.AddListener(() => {
                if (!confirmReset) { confirmReset = true; resetLabel.text = "Точно удалить Пито и весь прогресс?"; return; }
                runtime.ResetProfile(); panel.Hide();
            });
            skipTutorial.onClick.AddListener(() => tutorial.SetEnabled(!runtime.TutorialActive));
            absence.onClick.AddListener(() => runtime.SimulateAbsence(3600));
            hunger.onClick.AddListener(() => { runtime.Session?.ChangeNeed(NeedKind.Satiety, -25); runtime.Save(); });
        }
        private void Update()
        {
            if (!panel.IsVisible) return;
            var p = runtime.Session?.Profile;
            status.text = "ОТЛАДКА • удержание 1,2 сек\nСкорость: ×" + runtime.TimeMultiplier +
                (p == null ? "\nПрофиля нет" : "\n" + p.petName + " • " + p.petTypeId + "/" + p.petVariantId +
                "\nИгровых часов: " + (p.gameSeconds / 3600).ToString("F2") +
                "\nОбучение: " + (runtime.TutorialActive ? p.tutorialStep.ToString() : "выключено / пройдено"));
        }
    }
}
