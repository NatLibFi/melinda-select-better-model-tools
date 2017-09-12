data <- read.table('table.txt')

png(file="error.png", bg="white", width=1200, height=600)


plot(data, type="n", xlab="Iterations", ylab="Error")
lines(data)

dev.off()