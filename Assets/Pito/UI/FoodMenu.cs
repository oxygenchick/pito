using System;
using UnityEngine;
using TMPro;
using Pito.Configuration;
using Pito.Infrastructure;

namespace Pito.UI
{
    public sealed class FoodMenu : MonoBehaviour
    {
        public GameRuntime runtime;
        public FoodCatalog catalog;
        public PanelView menu, popup;
        public UnityEngine.UI.Button[] cards;
        public TMP_Text[] cardLabels;
        public UnityEngine.UI.Image[] cardIcons;
        public UnityEngine.UI.Button previous, next, confirm, cancel;
        public TMP_Text pageLabel, question;
        public UnityEngine.UI.Image selectedIcon;
        public NeedsView needs;
        public event Action Opened, FoodSelected, Cancelled, Fed;
        private int page;
        private FoodDefinition selected;

        private void Start()
        {
            for (int i = 0; i < cards.Length; i++) { int index = i; cards[i].onClick.AddListener(() => Select(index)); }
            previous.onClick.AddListener(() => Turn(-1)); next.onClick.AddListener(() => Turn(1));
            confirm.onClick.AddListener(Confirm); cancel.onClick.AddListener(Cancel);
        }
        public void Open() { needs.Hide(); menu.Show(); Refresh(); Opened?.Invoke(); }
        public void Toggle() { if (menu.IsVisible) Close(); else Open(); }
        public void Close() { selected = null; menu.Hide(); popup.Hide(); }
        private void Turn(int delta)
        {
            int pages = Mathf.Max(1, Mathf.CeilToInt(catalog.items.Length / 4f));
            page = (page + delta + pages) % pages; Refresh();
        }
        private void Refresh()
        {
            int pages = Mathf.Max(1, Mathf.CeilToInt(catalog.items.Length / 4f));
            page = Mathf.Clamp(page, 0, pages - 1); pageLabel.text = (page + 1) + " / " + pages;
            previous.interactable = next.interactable = pages > 1;
            for (int i = 0; i < cards.Length; i++)
            {
                int index = page * 4 + i;
                cards[i].gameObject.SetActive(index < catalog.items.Length);
                if (index >= catalog.items.Length) continue;
                var food = catalog.items[index];
                cardLabels[i].text = food.title + "\n" + food.price + " шт.";
                cardIcons[i].sprite = food.icon;
            }
        }
        public void Select(int index)
        {
            int actual = page * 4 + index;
            if (index < 0 || index >= 4 || actual >= catalog.items.Length) return;
            selected = catalog.items[actual];
            selectedIcon.sprite = selected.icon;
            question.text = selected.title + "\n\nПокормить Пито за " + selected.price +
                " штучек?\nСытость +" + selected.satiety + "%\nНужное: еда";
            confirm.interactable = true; popup.Show(); FoodSelected?.Invoke();
        }
        public void Cancel() { selected = null; popup.Hide(); Cancelled?.Invoke(); }
        public void Confirm()
        {
            if (selected == null || runtime.Session == null) return;
            var food = selected;
            if (!runtime.Session.TryFeed(food.id, food.price, food.satiety))
            {
                question.text = "Не хватает " + Mathf.Max(0, food.price - runtime.Session.Profile.money) +
                    " штучек.\nВыбери еду подешевле.";
                confirm.interactable = false; return;
            }
            selected = null;
            Close(); runtime.Save(); needs.ShowFeedback(); Fed?.Invoke();
        }
    }
}
