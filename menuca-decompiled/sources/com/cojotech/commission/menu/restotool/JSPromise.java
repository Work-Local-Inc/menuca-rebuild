package com.cojotech.commission.menu.restotool;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.google.gson.Gson;
import java.util.concurrent.Callable;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

/* loaded from: classes.dex */
public class JSPromise {
    private static ThreadPoolExecutor m_executor;
    private static int m_last_promise_id;
    private Callable m_callable;
    private String m_promise_id;
    private Object m_value;
    private WebView m_wv;
    private ReentrantLock m_lock = new ReentrantLock();
    private boolean m_complete = false;

    static {
        TimeUnit timeUnit = TimeUnit.DAYS;
        m_executor = new ThreadPoolExecutor(4, 8, 10L, TimeUnit.SECONDS, new LinkedBlockingDeque());
    }

    JSPromise(WebView webView, Callable callable) {
        this.m_wv = webView;
        this.m_callable = callable;
        StringBuilder sb = new StringBuilder();
        sb.append("p");
        int i = m_last_promise_id;
        m_last_promise_id = i + 1;
        sb.append(Integer.toString(i));
        this.m_promise_id = sb.toString();
        run();
    }

    private void run() {
        m_executor.execute(new Runnable() { // from class: com.cojotech.commission.menu.restotool.JSPromise.1
            @Override // java.lang.Runnable
            public void run() {
                try {
                    JSPromise.this.m_value = JSPromise.this.m_callable.call();
                    JSPromise.this.m_wv.post(new Runnable() { // from class: com.cojotech.commission.menu.restotool.JSPromise.1.1
                        @Override // java.lang.Runnable
                        public void run() {
                            JSPromise.this.m_lock.lock();
                            JSPromise.this.m_wv.evaluateJavascript("if (__java_promises." + JSPromise.this.m_promise_id + ") { __java_promises." + JSPromise.this.m_promise_id + "(" + JSPromise.this.getValue() + ");delete __java_promises." + JSPromise.this.m_promise_id + ";}", null);
                            JSPromise.this.m_complete = true;
                            JSPromise.this.m_lock.unlock();
                        }
                    });
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        });
    }

    @JavascriptInterface
    public String getId() {
        return this.m_promise_id;
    }

    @JavascriptInterface
    public String getValue() {
        return new Gson().toJson(this.m_value);
    }

    @JavascriptInterface
    public boolean complete() {
        return this.m_complete;
    }

    @JavascriptInterface
    public void lock() {
        this.m_lock.lock();
    }

    @JavascriptInterface
    public void unlock() {
        this.m_lock.unlock();
    }
}
