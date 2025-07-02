import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/AI-Interviewer.png"
            alt="AI Interviewer"
            width={56}
            height={56}
            className="rounded-full border-2 border-[#C5DAFF] bg-[#D9D9D9]"
          />
          <h1 className="text-xl font-bold">
            <span className="text-blue-600">AI </span>Interview Preparation
          </h1>
        </div>
        <Image
          src="/AI-Interviewer.png"
          alt="User Avatar"
          width={56}
          height={56}
          className="rounded-full border-2 border-[#C5DAFF] bg-[#D9D9D9]"
        />
      </div>
    </header>
  );
}
