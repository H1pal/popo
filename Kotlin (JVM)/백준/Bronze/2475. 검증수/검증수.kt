fun main() {
    val list = readln().split(" ").sumOf { it.toInt() * it.toInt() }
    println(list % 10)
}