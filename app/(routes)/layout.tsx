import Header from "@/components/header";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <Header />
      <div
        className="overflow-hidden"
      >{children}</div>
    </main>
  );
}
