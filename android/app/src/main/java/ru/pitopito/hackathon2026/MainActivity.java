package ru.pitopito.hackathon2026;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.net.Uri;
import android.graphics.Color;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.View;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;

/** Offline same-origin host. No JavaScript/native bridge, no network. */
public final class MainActivity extends Activity {
    private WebView web;
    private static final String HOST = "appassets.androidplatform.net";
    private static final String ENTRY = "https://" + HOST + "/assets/index.html";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(236,230,255));
        setContentView(web);
        enterFullscreen();
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            web.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.ime());
                v.setPadding(bars.left,bars.top,bars.right,bars.bottom);
                return insets;
            });
        }
        WebSettings config = web.getSettings();
        config.setJavaScriptEnabled(true);
        config.setDomStorageEnabled(true);
        config.setAllowFileAccess(false);
        config.setAllowContentAccess(false);
        config.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        config.setMediaPlaybackRequiresUserGesture(true);
        config.setTextZoom(100);
        WebView.setWebContentsDebuggingEnabled(false);
        CookieManager.getInstance().setAcceptCookie(false);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", assetPath -> {
                try {
                    String mime = assetPath.endsWith(".mjs") ? "text/javascript" :
                        assetPath.endsWith(".css") ? "text/css" :
                        assetPath.endsWith(".html") ? "text/html" :
                        assetPath.endsWith(".ttf") ? "font/ttf" :
                        assetPath.endsWith(".png") ? "image/png" : "application/octet-stream";
                    return new WebResourceResponse(mime,"UTF-8",getAssets().open(assetPath));
                } catch (IOException e) { return blocked(); }
            }).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
                return response != null ? response : blocked();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !("https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && uri.getPath().startsWith("/assets/"));
            }
        });
        web.loadUrl(ENTRY);
    }
    private void enterFullscreen() {
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.systemBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
    }
    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enterFullscreen();
    }
    private static WebResourceResponse blocked() {
        return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
    }
    @Override protected void onPause() {
        web.evaluateJavascript("window.dispatchEvent(new Event('pito-native-pause'))",null);
        web.onPause();super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if(web!=null){web.onResume();web.evaluateJavascript("window.dispatchEvent(new Event('pito-native-resume'))",null);}
    }
    @Override public void onBackPressed() {
        new AlertDialog.Builder(this).setTitle("Закрыть игру?")
            .setMessage("Пито будет ждать тебя здесь.")
            .setPositiveButton("Закрыть",(dialog,which)->finish())
            .setNegativeButton("Играть",null).show();
    }
    @Override protected void onDestroy(){if(web!=null)web.destroy();super.onDestroy();}
}
