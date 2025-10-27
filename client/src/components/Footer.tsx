export function Footer() {
  return (
    <footer className="bg-brand-dark text-white py-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm" data-testid="text-copyright">
          © {new Date().getFullYear()} 마하나임 온라인 훈련 시스템. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
