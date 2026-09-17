using System;
using UnityEngine;
using Pito.Core;
using Pito.Configuration;

namespace Pito.Infrastructure
{
    public sealed class GameRuntime : MonoBehaviour
    {
        public GameBalance balance;
        public GameSession Session { get; private set; }
        public float TimeMultiplier { get; private set; } = 1;
        public bool SimulationPaused { get; set; }
        public event Action ProfileChanged;
        public string LastStorageError { get; private set; }
        private readonly IProfileStore store = new ProfileStore();
        private bool focused = true, suspended, inactive;
        private float saveTimer;
        private long inactiveTicks;

        public bool TutorialActive => Session != null && Session.Profile.tutorialEnabled &&
            Session.Profile.tutorialStep != TutorialStep.Complete;

        private void Awake()
        {
            TimeMultiplier = balance.normalTimeMultiplier;
            var profile = store.Load();
            if (profile != null)
            {
                Session = new GameSession(profile);
                ApplyOffline(profile.lastUtcTicks, DateTime.UtcNow.Ticks);
                Save();
            }
        }

        public void CreateProfile(string petName, int colorIndex)
        {
            Session = new GameSession(new PlayerProfile {
                petName = string.IsNullOrWhiteSpace(petName) ? "Пито Первый" : petName.Trim(),
                colorIndex = Mathf.Clamp(colorIndex, 0, balance.petColors.Length - 1),
                money = balance.startingMoney, lastUtcTicks = DateTime.UtcNow.Ticks
            });
            Save();
            ProfileChanged?.Invoke();
        }

        private void Update()
        {
            if (inactive || Session == null) return;
            if (!TutorialActive && !SimulationPaused) Advance(Time.unscaledDeltaTime * TimeMultiplier);
            saveTimer += Time.unscaledDeltaTime;
            if (saveTimer >= 10) { saveTimer = 0; Save(); }
        }

        private void Advance(double seconds) => Session?.Advance(seconds, balance.affectionLossPerGameHour,
            balance.satietyLossPerGameHour, balance.cleanlinessLossPerGameHour);

        public void SetTimeMultiplier(float value) => TimeMultiplier = Mathf.Clamp(value, 0, 86400);

        public void SimulateAbsence(double realSeconds)
        {
            if (Session == null || TutorialActive) return;
            Advance(Math.Max(0, Math.Min(realSeconds, balance.maxOfflineRealHours * 3600)) * TimeMultiplier);
            Save();
        }

        private void ApplyOffline(long from, long to)
        {
            if (Session == null || TutorialActive) return;
            // Offline uses the production rate; a forgotten debug speed never multiplies a whole night.
            double seconds = Math.Max(0, Math.Min((to - from) / (double)TimeSpan.TicksPerSecond,
                balance.maxOfflineRealHours * 3600));
            Advance(seconds * balance.normalTimeMultiplier);
        }

        public void Save()
        {
            if (Session == null) return;
            Session.Profile.lastUtcTicks = inactive ? inactiveTicks : DateTime.UtcNow.Ticks;
            try { store.Save(Session.Profile); LastStorageError = null; }
            catch (Exception e) { LastStorageError = "Не удалось сохранить прогресс"; Debug.LogError("Pito save: " + e.Message); }
        }

        public void ResetProfile()
        {
            store.Delete();
            Session = null;
            TimeMultiplier = balance.normalTimeMultiplier;
            SimulationPaused = false;
            ProfileChanged?.Invoke();
        }

        private void OnApplicationFocus(bool value) { focused = value; UpdateActivity(); }
        private void OnApplicationPause(bool value) { suspended = value; UpdateActivity(); }
        private void UpdateActivity()
        {
            bool next = suspended || !focused;
            if (next == inactive) return;
            if (next)
            {
                inactiveTicks = DateTime.UtcNow.Ticks;
                inactive = true;
                Save();
            }
            else
            {
                inactive = false;
                ApplyOffline(inactiveTicks, DateTime.UtcNow.Ticks);
                Save();
            }
        }

        private void OnApplicationQuit() { Save(); }
    }
}
