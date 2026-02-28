export default function NewsDetailLoading() {
  return (
    <main className="flex justify-center w-full px-[10px] pb-[40px]">
      <div className="bg-card flex flex-col items-start p-[15px] rounded-card w-full max-w-[500px]">
        <div className="flex items-center justify-between w-full mb-[20px]">
          <div className="flex gap-[5px]">
            <div className="ehvm-skeleton h-[27px] w-[88px] rounded-pill" />
            <div className="ehvm-skeleton h-[27px] w-[64px] rounded-pill" />
          </div>
          <div className="ehvm-skeleton h-[27px] w-[64px] rounded-pill" />
        </div>

        <div className="flex flex-col gap-[10px] w-full mb-[24px]">
          <div className="ehvm-skeleton h-[32px] w-[94%] rounded-pill" />
          <div className="ehvm-skeleton h-[32px] w-[72%] rounded-pill" />
        </div>

        <div className="flex items-center gap-[10px] mb-[24px]">
          <div className="ehvm-skeleton size-[28px] rounded-full" />
          <div className="ehvm-skeleton h-[13px] w-[100px] rounded-pill" />
          <div className="ehvm-skeleton h-[13px] w-[70px] rounded-pill" />
        </div>

        <div className="ehvm-skeleton w-full aspect-[16/9] rounded-icon mb-[30px]" />

        <div className="flex flex-col gap-[16px] w-full px-[5px]">
          <div className="ehvm-skeleton h-[16px] w-full rounded-pill" />
          <div className="ehvm-skeleton h-[16px] w-[94%] rounded-pill" />
          <div className="ehvm-skeleton h-[16px] w-[86%] rounded-pill" />
          <div className="ehvm-skeleton h-[180px] w-full rounded-icon" />
          <div className="ehvm-skeleton h-[16px] w-[90%] rounded-pill" />
        </div>
      </div>
    </main>
  );
}
