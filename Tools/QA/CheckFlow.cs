var app = UnityEngine.Object.FindFirstObjectByType<Pito.UI.AppFlow>();
var runtime = app.runtime;
if (runtime.Session != null) throw new System.Exception("Flow QA requires a fresh profile; refusing to overwrite an existing pet.");
var results = new System.Collections.Generic.List<string>();
void Check(bool value, string name) { if (!value) throw new System.Exception(name); results.Add(name); }
UnityEngine.GameObject Click(UnityEngine.GameObject target)
{
    UnityEngine.Canvas.ForceUpdateCanvases();
    UnityEngine.Vector2 position;
    if (target.transform is UnityEngine.RectTransform r) position = UnityEngine.RectTransformUtility.WorldToScreenPoint(null, r.TransformPoint(r.rect.center));
    else position = UnityEngine.Camera.main.WorldToScreenPoint(target.transform.position);
    var e = new UnityEngine.EventSystems.PointerEventData(UnityEngine.EventSystems.EventSystem.current) { position = position };
    var hits = new System.Collections.Generic.List<UnityEngine.EventSystems.RaycastResult>();
    UnityEngine.EventSystems.EventSystem.current.RaycastAll(e,hits);
    if(hits.Count==0)throw new System.Exception("No hit: "+target.name);
    e.pointerCurrentRaycast=hits[0];e.pointerPressRaycast=hits[0];
    UnityEngine.EventSystems.ExecuteEvents.ExecuteHierarchy(hits[0].gameObject,e,UnityEngine.EventSystems.ExecuteEvents.pointerClickHandler);
    return hits[0].gameObject;
}
app.ShowTitle();
System.Collections.IEnumerator Run()
{
yield return new UnityEngine.WaitForSecondsRealtime(.4f);
Click(app.startButton.gameObject);
yield return new UnityEngine.WaitForSecondsRealtime(.4f);
Check(app.storyScreen.activeSelf && app.storyButtonLabel.text=="Дальше", "Start enters story");
Click(app.storyNext.gameObject);Click(app.storyNext.gameObject);
Check(app.storyButtonLabel.text=="Начать", "Third story page changes CTA");
Click(app.storyNext.gameObject);
yield return new UnityEngine.WaitForSecondsRealtime(.4f);
Check(app.creationScreen.activeSelf, "Story enters creation");
Click(app.colorButtons[2].gameObject);app.nameInput.text="Тестовый Пито";Click(app.bornButton.gameObject);
yield return new UnityEngine.WaitForSecondsRealtime(.8f);
Check(runtime.Session.Profile.petName=="Тестовый Пито" && runtime.Session.Profile.colorIndex==2, "Creation preserves chosen name and color");
Check(runtime.TutorialActive && !app.tutorial.hud.activeSelf,"Tutorial starts before HUD reveal");
Click(app.tutorial.pet.gameObject);
yield return new UnityEngine.WaitForSecondsRealtime(.4f);
Check(runtime.Session.Profile.tutorialStep==Pito.Core.TutorialStep.OpenFood,"Pet click advances tutorial");
var wash=app.tutorial.hud.transform.Find("Wash").gameObject;
Check(Click(wash)==app.tutorial.overlay.gameObject,"Tutorial shield intercepts wash");
Click(app.tutorial.foodButton.gameObject);
yield return new UnityEngine.WaitForSecondsRealtime(.4f);
Check(runtime.Session.Profile.tutorialStep==Pito.Core.TutorialStep.ChooseFood,"Only food target opens catalogue");
Click(app.food.cards[0].gameObject);
yield return new UnityEngine.WaitForSecondsRealtime(.4f);
Check(runtime.Session.Profile.tutorialStep==Pito.Core.TutorialStep.ConfirmFood,"Food selection opens confirmation");
Click(app.food.confirm.gameObject);
Check(runtime.Session.Profile.money==27 && runtime.Session.Profile.satiety==40,"Confirmed purchase debits three and restores fifteen");
Check(runtime.Session.Profile.tutorialStep==Pito.Core.TutorialStep.FinishedMessage,"Tutorial finishes on successful feeding");
Click(app.tutorial.overlay.gameObject);
Check(!runtime.TutorialActive,"Final message dismissal releases shield");
runtime.SetTimeMultiplier(0);
runtime.Save();
var saved = new Pito.Infrastructure.ProfileStore().Load();
Check(saved!=null && saved.petName=="Тестовый Пито" && saved.money==27,"Actual platform store roundtrip");
UnityEngine.Debug.Log("PITO_FLOW_PASS: " + string.Join("; ", results));
}
app.StartCoroutine(Run());
return "Flow QA scheduled across real frames";
