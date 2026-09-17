using System;
using UnityEngine;
using Pito.Core;

namespace Pito.Infrastructure
{
    public interface IProfileStore
    {
        PlayerProfile Load();
        void Save(PlayerProfile profile);
        void Delete();
    }

    // PlayerPrefs supplies platform persistence (including browser storage in WebGL).
    // Only our own two keys are removed on reset; unrelated application data is untouched.
    public sealed class ProfileStore : IProfileStore
    {
        private const string Key = "pito.profile.v1";
        private const string Backup = "pito.profile.v1.backup";

        public PlayerProfile Load()
        {
            var primary = Parse(PlayerPrefs.GetString(Key, ""));
            return primary ?? Parse(PlayerPrefs.GetString(Backup, ""));
        }

        private static PlayerProfile Parse(string json)
        {
            if (string.IsNullOrEmpty(json)) return null;
            try
            {
                var p = JsonUtility.FromJson<PlayerProfile>(json);
                if (p == null || p.version != 1 || string.IsNullOrWhiteSpace(p.petName) ||
                    p.lastUtcTicks <= 0 || p.lastUtcTicks > DateTime.MaxValue.Ticks || p.money < 0 ||
                    double.IsNaN(p.gameSeconds) || double.IsInfinity(p.gameSeconds) || p.gameSeconds < 0 ||
                    !ValidNeed(p.affection) || !ValidNeed(p.satiety) || !ValidNeed(p.cleanliness) ||
                    !Enum.IsDefined(typeof(TutorialStep), p.tutorialStep)) return null;
                p.operations ??= new System.Collections.Generic.List<MoneyOperation>();
                return p;
            }
            catch (Exception e) { Debug.LogWarning("Pito: unable to read profile: " + e.Message); return null; }
        }

        private static bool ValidNeed(float v) => !float.IsNaN(v) && !float.IsInfinity(v) && v >= 0 && v <= 100;

        public void Save(PlayerProfile profile)
        {
            string previous = PlayerPrefs.GetString(Key, "");
            if (Parse(previous) != null) PlayerPrefs.SetString(Backup, previous);
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(profile));
            PlayerPrefs.Save();
        }

        public void Delete()
        {
            PlayerPrefs.DeleteKey(Key);
            PlayerPrefs.DeleteKey(Backup);
            PlayerPrefs.Save();
        }
    }
}
