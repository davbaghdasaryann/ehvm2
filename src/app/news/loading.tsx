export default function NewsLandingLoading() {
  const iconPositions = [
    "top-[10%] left-[8%]",
    "top-[14%] right-[10%]",
    "top-[36%] left-[4%]",
    "top-[42%] right-[8%]",
    "bottom-[24%] left-[16%]",
  ];

  return (
    <main className="relative w-full flex-1 flex flex-col items-center h-[calc(100dvh-97px)]">
      <div className="absolute inset-0 pointer-events-none">
        {iconPositions.map((position, idx) => (
          <div
            key={idx}
            className={`ehvm-skeleton absolute ${position} size-[80px] md:size-[100px] rounded-icon shadow-icon`}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-[8px]">
          <div className="ehvm-skeleton h-[38px] w-[94px] rounded-pill" />
          <div className="ehvm-skeleton h-[44px] w-[110px] rounded-pill" />
        </div>
        <div className="mt-[10px] flex flex-col items-center gap-[6px]">
          <div className="ehvm-skeleton h-[12px] w-[150px] rounded-pill" />
        </div>
      </div>

      <div className="flex-1 flex items-end justify-center pb-[42px]">
        <div className="ehvm-skeleton h-[41px] w-[160px] rounded-pill" />
      </div>
    </main>
  );
}
