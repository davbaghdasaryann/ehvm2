export default function GlobalLoading() {
  const iconPositions = [
    "top-[8%] left-[10%]",
    "top-[14%] right-[12%]",
    "top-[38%] left-[4%]",
    "top-[44%] right-[6%]",
    "bottom-[22%] left-[18%]",
    "bottom-[28%] right-[18%]",
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
        <div className="ehvm-skeleton h-[44px] w-[120px] rounded-pill" />
        <div className="mt-[10px] flex flex-col items-center gap-[6px]">
          <div className="ehvm-skeleton h-[12px] w-[210px] rounded-pill" />
          <div className="ehvm-skeleton h-[12px] w-[170px] rounded-pill" />
        </div>
      </div>

      <div className="flex-1 flex items-end justify-center pb-[42px]">
        <div className="ehvm-skeleton h-[41px] w-[150px] rounded-pill" />
      </div>
    </main>
  );
}
