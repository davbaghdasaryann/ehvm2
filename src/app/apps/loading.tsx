export default function AppsLoading() {
  return (
    <main className="w-full flex flex-col items-center px-[10px] pb-[40px]">
      <div className="w-full max-w-[1180px]">
        <div className="flex gap-[10px] justify-center">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="ehvm-skeleton h-[41px] w-[110px] rounded-pill" />
          ))}
        </div>
      </div>

      <div className="w-full max-w-[1180px] flex flex-wrap gap-[10px] justify-center mt-[18px]">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-card rounded-card p-[15px] w-full max-w-[382px] min-w-0 overflow-hidden">
            <div className="flex gap-[10px] items-center">
              <div className="ehvm-skeleton size-[100px] rounded-icon shrink-0" />
              <div className="flex flex-col gap-[8px] w-full">
                <div className="ehvm-skeleton h-[22px] w-[72%] rounded-pill" />
                <div className="ehvm-skeleton h-[14px] w-[52%] rounded-pill" />
                <div className="flex gap-[5px] pt-[4px] flex-wrap">
                  <div className="ehvm-skeleton h-[27px] w-[80px] rounded-pill shrink-0" />
                  <div className="ehvm-skeleton h-[27px] w-[90px] rounded-pill shrink-0" />
                  <div className="ehvm-skeleton h-[27px] w-[60px] rounded-pill shrink-0" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
