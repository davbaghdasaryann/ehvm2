export default function NewsAllLoading() {
  return (
    <main className="flex flex-col items-center w-full max-w-[402px] px-[18px] pb-[40px]">
      <div className="w-full mb-[18px] flex gap-[10px] justify-center">
        <div className="ehvm-skeleton h-[41px] w-[90px] rounded-pill" />
        <div className="ehvm-skeleton h-[41px] w-[100px] rounded-pill" />
        <div className="ehvm-skeleton h-[41px] w-[90px] rounded-pill" />
      </div>

      <div className="w-full mb-[15px]">
        <div className="ehvm-skeleton w-full aspect-[334/202] rounded-icon" />
        <div className="p-[15px] flex flex-col gap-[8px]">
          <div className="ehvm-skeleton h-[20px] w-[80%] rounded-pill" />
          <div className="ehvm-skeleton h-[12px] w-[70px] rounded-pill" />
        </div>
      </div>

      <div className="flex flex-col gap-[13px] w-full">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="flex gap-[18px] items-center w-full">
            <div className="ehvm-skeleton shrink-0 size-[75px] rounded-icon" />
            <div className="flex flex-col gap-[6px] w-full">
              <div className="ehvm-skeleton h-[18px] w-[88%] rounded-pill" />
              <div className="ehvm-skeleton h-[12px] w-[62px] rounded-pill" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
