data <- read.table('table.txt')
X11()
plot(data, type="n")
lines(data)

message("Press Return To Continue")
invisible(readLines("stdin", n=1))
