      </section>
      <footer className="site-footer" role="contentinfo">
        <p className="footer-brand">little library<span style={{color: 'var(--red)'}}>.</span></p>
      </footer>
      <style dangerouslySetInnerHTML={{__html: `
        .pin:hover .pin-overlay { opacity: 1 !important; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </>
  );
}
