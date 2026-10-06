"use client";

import Image from "next/image";
import { useState } from "react";

export default function BrandHeader() {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="brand-header">
      <div className="brand-logo-frame">
        {!logoError ? (
          <Image
            src="/almafaaz-logo.png"
            alt="ALMAFAAZ ACADEMY logo"
            width={112}
            height={112}
            className="brand-logo-image"
            priority
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="brand-logo-fallback" aria-hidden="true">
            A
          </span>
        )}
      </div>

      <div className="brand-name">ALMAFAAZ</div>
      <div className="brand-subtitle">ACADEMY</div>

      <div className="brand-divider">
        <span />
        <span />
        <span />
      </div>

      <p className="brand-motto">
        Knowledge • Character • Excellence
      </p>
    </header>
  );
}
